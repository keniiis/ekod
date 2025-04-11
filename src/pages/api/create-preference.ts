import type { APIRoute } from 'astro';
// Import specific classes/types from the SDK
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { saveOrderData } from '../../utils/tempOrderStore'; // Importar utilidad de almacenamiento temporal
import { randomUUID } from 'node:crypto'; // Para generar IDs únicos

// IMPORTANT: Access Token should be set as an environment variable
const MERCADO_PAGO_ACCESS_TOKEN = import.meta.env.MERCADO_PAGO_ACCESS_TOKEN;

// Initialize the Mercado Pago client
// Do this outside the handler if the token is available, or handle the error case inside
let client: MercadoPagoConfig | null = null;
if (MERCADO_PAGO_ACCESS_TOKEN) {
   client = new MercadoPagoConfig({ accessToken: MERCADO_PAGO_ACCESS_TOKEN });
} else {
   console.error('Error: MERCADO_PAGO_ACCESS_TOKEN environment variable is not set.');
}

// Define the expected structure of items in the request body
interface RequestItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
}

export const POST: APIRoute = async ({ request, url }) => { // Destructure url directly
  // Check if client was initialized (token was present)
  if (!client) {
     return new Response(JSON.stringify({ error: 'Server configuration error: Access Token missing.' }), {
       status: 500,
       headers: { 'Content-Type': 'application/json' },
     });
  }

  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ error: 'Invalid content type, expected application/json' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' },
     });
  }

  try {
    const body = await request.json();
    console.log("Recibido en backend (body completo):", body);

    // 1. Extraer items Y datos del cliente del body
    //    Asegúrate de que tu frontend envíe estos campos en el body JSON
    const items = body.items as RequestItem[];
    const customerData = {
        firstName: body.firstName || body.nombre,
        lastName: body.lastName || body.apellido,
        phone: body.phone || body.telefono,
        email: body.email, // Email es crucial
        address: body.address || body.direccion,
        region: body.region,
        commune: body.commune || body.comuna,
        observations: body.observations || body.observacion || '' // Puede ser opcional
    };
    const shippingCost = body.shippingCost; // <-- ADDED: Extract shipping cost
    console.log("Items extraídos:", items);
    console.log("Datos del cliente extraídos:", customerData);
    console.log("Costo de envío extraído:", shippingCost); // <-- ADDED: Log shipping cost

    // 2. Validar items (como antes)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or empty items array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const validItems = items.every(item =>
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.quantity === 'number' && item.quantity > 0 &&
        typeof item.unit_price === 'number' && item.unit_price >= 0
    );

    if (!validItems) {
       return new Response(JSON.stringify({ error: 'Invalid item structure in request body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Validar shippingCost y datos básicos del cliente
    if (typeof shippingCost !== 'number' || shippingCost < 0) {
        return new Response(JSON.stringify({ error: 'Invalid or missing shipping cost' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    if (!customerData.email || !customerData.firstName || !customerData.lastName || !customerData.phone || !customerData.address || !customerData.region || !customerData.commune) {
        return new Response(JSON.stringify({ error: 'Missing required customer data fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 4. Generar un ID de orden único
    const orderId = randomUUID();
    console.log(`Generated unique orderId: ${orderId}`);

    // 5. Guardar datos del cliente temporalmente
    try {
        await saveOrderData(orderId, customerData);
    } catch (saveError: any) {
        console.error(`Error saving temporary order data for ${orderId}:`, saveError);
        return new Response(JSON.stringify({ error: 'Failed to save order data before creating preference', details: saveError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 6. Crear el objeto de preferencia para Mercado Pago, incluyendo external_reference y envío
    const preferenceItems = items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: Math.round(item.unit_price), // Round to nearest integer for CLP
        currency_id: 'CLP',
    }));

    // Add shipping cost as an item if it's greater than zero
    if (shippingCost > 0) {
        preferenceItems.push({
            id: 'shipping',
            title: 'Costo de Envío',
            quantity: 1,
            unit_price: Math.round(shippingCost), // Round shipping cost as well
            currency_id: 'CLP',
        });
    }

    const preference: any = {
      external_reference: orderId,
      items: preferenceItems,
      back_urls: {
        success: `${url.origin}/orden-confirmada`, // Redirect to order confirmation on success
        failure: `${url.origin}/`, // Redirect to home or cart on failure
        pending: `${url.origin}/`, // Redirect to home or cart on pending
      },
      auto_return: 'approved',
      notification_url: `${url.origin}/api/payment-webhook`,
      payer: {
        email: customerData.email,
        name: customerData.firstName, // Add first name
        surname: customerData.lastName, // Add last name
        phone: {
            area_code: "", // Chilean mobile numbers usually don't have a separate area code
            number: customerData.phone // Assuming this is the 9-digit number
        }
      }
    };

    console.log("Creating preference with data (including shipments and payer details):", JSON.stringify(preference, null, 2));

    // Create a Preference instance using the client
    const preferenceClient = new Preference(client);
    const response = await preferenceClient.create({ body: preference });
    
    console.log("Mercado Pago preference response:", response);

    if (response.id) {
      // Determine checkout URL based on FORCE_MP_PRODUCTION env var
      const forceProduction = import.meta.env.FORCE_MP_PRODUCTION === 'true';
      console.log(`FORCE_MP_PRODUCTION: ${import.meta.env.FORCE_MP_PRODUCTION}, forceProduction: ${forceProduction}`);
      const checkoutUrl = forceProduction ? response.init_point : response.sandbox_init_point;
      const isSandboxEnv = !forceProduction; // Reflecting the actual environment used

      // Calculamos el monto total incluyendo envío (shippingCost is already rounded when added to preferenceItems)
      const totalAmount = preferenceItems.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity), 
        0
      ); // No need to add shippingCost here again, it's part of preferenceItems

      // Define the data to send back
      const responseData = {
        preferenceId: response.id,
        checkoutUrl, // Use the determined checkout URL
        isSandbox: isSandboxEnv, // Reflect the actual environment used based on the flag
        totalAmount, // Total amount calculated from items (including shipping item)
        orderId
      };

      // --- Explicitly log the URL being sent back ---
      console.log(`Sending response to frontend with checkoutUrl: ${responseData.checkoutUrl}`);

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      console.error('Error creating Mercado Pago preference:', response);
      return new Response(JSON.stringify({ error: 'Failed to create payment preference' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
