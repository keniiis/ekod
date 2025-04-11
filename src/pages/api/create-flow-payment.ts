import type { APIRoute } from 'astro';
import crypto from 'crypto'; // Needed for HMAC signature
import { saveOrderData } from '../../utils/tempOrderStore'; // Importar utilidad de almacenamiento temporal
import { randomUUID } from 'node:crypto'; // Para generar IDs únicos

// IMPORTANT: Flow credentials should be set as environment variables
const FLOW_API_KEY = import.meta.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = import.meta.env.FLOW_SECRET_KEY;

// Flow API endpoint (use sandbox or production URL as needed)
const FLOW_API_URL = 'https://www.flow.cl/api'; // ✅ PRODUCCIÓN

// Function to generate the HMAC signature required by Flow
function generateFlowSignature(params: Record<string, any>, secret: string): string {
  // Sort parameters alphabetically by key
  const sortedKeys = Object.keys(params).sort();
  const sortedParamsString = sortedKeys.map(key => `${key}${params[key]}`).join('');
  
  // Create HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(sortedParamsString);
  return hmac.digest('hex');
}

export const POST: APIRoute = async ({ request, url }) => {
  // --- Add log to check the environment variable value ---
  console.log(`API Route: Value read for FLOW_API_KEY = ${FLOW_API_KEY}`); 
  // -------------------------------------------------------

  if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
    console.error('Error: FLOW_API_KEY or FLOW_SECRET_KEY environment variable is not set.');
    return new Response(JSON.stringify({ error: 'Server configuration error: Flow credentials missing.' }), {
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
    console.log("Recibido en backend (Flow):", body);

    // 1. Extraer amount Y datos del cliente del body
    //    Asegúrate de que tu frontend envíe estos campos en el body JSON
    const { amount } = body; // Amount sigue siendo necesario para Flow
    const customerData = {
        firstName: body.firstName || body.nombre,
        lastName: body.lastName || body.apellido,
        phone: body.phone || body.telefono,
        email: body.email, // Email es crucial
        address: body.address || body.direccion,
        region: body.region,
        commune: body.commune || body.comuna,
        observations: body.observations || body.observacion || ''
    };
    console.log("Datos del cliente extraídos (Flow):", customerData);

    // 2. Validar amount y datos básicos del cliente
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Missing or invalid amount' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
        });
    }
    if (!customerData.email || !customerData.firstName || !customerData.lastName || !customerData.phone || !customerData.address || !customerData.region || !customerData.commune) {
        return new Response(JSON.stringify({ error: 'Missing required customer data fields' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
        });
    }

    // 3. Generar un ID de orden único
    const orderId = randomUUID(); // Usar UUID para mayor unicidad
    const subject = `Pago Orden ${orderId}`;
    console.log(`Generated unique orderId (Flow): ${orderId}`);

    // 4. Guardar datos del cliente temporalmente
    try {
        await saveOrderData(orderId, customerData);
    } catch (saveError: any) {
        console.error(`Error saving temporary order data for ${orderId} (Flow):`, saveError);
        return new Response(JSON.stringify({ error: 'Failed to save order data before creating Flow payment', details: saveError.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        });
    }

    // 5. Preparar datos para la API de Flow
    const params: Record<string, any> = {
      apiKey: FLOW_API_KEY,
      commerceOrder: orderId, // <-- USAR EL orderId GENERADO
      subject: subject,
      currency: 'CLP',
      amount: Math.round(amount),
      email: customerData.email, // Usar el email de customerData
      paymentMethod: 9,
      // !! IMPORTANTE: Cambiar urlConfirmation para apuntar al webhook unificado !!
      urlConfirmation: `${url.origin}/api/payment-webhook`,
      urlReturn: `${url.origin}/orden-confirmada`, // Usar la misma página de retorno que MP
      // Considera añadir 'optional' si necesitas pasar datos extra que Flow devuelva
      // optional: JSON.stringify({ source: 'flow', orderId: orderId }) // Ejemplo
    };

    // Generate the signature
    params.s = generateFlowSignature(params, FLOW_SECRET_KEY);

    console.log('Sending data to Flow API (using fetch):', params);

    // --- Call Flow API using fetch ---
    const flowApiResponse = await fetch(`${FLOW_API_URL}/payment/create`, {
       method: 'POST',
       headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
       },
       // Body needs to be URLSearchParams for this Content-Type
       body: new URLSearchParams(params) 
    });

    const flowResponseData = await flowApiResponse.json(); // Parse the JSON response body
    console.log('Flow API Response Status:', flowApiResponse.status);
    console.log('Flow API Response Body:', flowResponseData);

    // --- Process Flow Response ---
    if (flowApiResponse.ok && flowResponseData && flowResponseData.url && flowResponseData.token) {
      const redirectUrl = `${flowResponseData.url}?token=${flowResponseData.token}`;
      console.log('Generated Flow Redirect URL:', redirectUrl);

     // Return the redirect URL to the frontend
     return new Response(JSON.stringify({ redirectUrl: redirectUrl }), {
       status: 200,
       headers: { 'Content-Type': 'application/json' },
     });
    } else {
      // Handle non-OK responses or missing data
      console.error('Error creating Flow payment order:', flowResponseData);
      const errorMessage = flowResponseData?.message || `Flow API request failed with status ${flowApiResponse.status}`;
      return new Response(JSON.stringify({ error: errorMessage }), { 
        status: flowApiResponse.status === 200 ? 500 : flowApiResponse.status, // Use Flow's status if not 200, otherwise 500
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error processing Flow request:', error.response?.data || error.message);
    return new Response(JSON.stringify({ error: 'Internal server error processing Flow payment', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
