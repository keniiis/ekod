import type { APIRoute } from 'astro';
// Import specific classes/types from the SDK
import { MercadoPagoConfig, Preference } from 'mercadopago';

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
    console.log("Recibido en backend (body completo):", body); // Log del body completo

    const items = body.items as RequestItem[];
    console.log("Items extraídos del body:", items); // Log de los items extraídos

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or empty items array in request body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic validation for items structure (add more specific checks if needed)
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

    // Create the preference object for Mercado Pago
    const preference = {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: Math.round(item.unit_price), // Round to nearest integer for CLP
        currency_id: 'CLP', // IMPORTANT: Set your currency (e.g., ARS, MXN, BRL)
      })),
      back_urls: {
        // IMPORTANT: Replace with your actual success/failure/pending URLs
        success: `${url.origin}/orden-confirmada`, // Use url.origin
        failure: `${url.origin}/orden-fallida`,   // Use url.origin
        pending: `${url.origin}/orden-pendiente`, // Use url.origin
      },
      auto_return: 'approved', // Automatically return to success URL on approval
      // notification_url: 'YOUR_WEBHOOK_URL', // Optional: For server-side notifications
    };

    console.log("Creating preference with data:", JSON.stringify(preference, null, 2));

    // Create a Preference instance using the client
    const preferenceClient = new Preference(client);
    const response = await preferenceClient.create({ body: preference });
    
    console.log("Mercado Pago preference response:", response);

    // The response structure might vary slightly, adjust based on actual SDK response
    if (response.id) { 
      // Return the preference ID to the frontend
      return new Response(JSON.stringify({ preferenceId: response.id }), {
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
