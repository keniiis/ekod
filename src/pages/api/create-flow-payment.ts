import type { APIRoute } from 'astro';
// Remove axios import
import crypto from 'crypto'; // Needed for HMAC signature

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
    // Expect total amount and email from frontend
    const { amount, email } = body; 
    const orderId = `AstroShop-${Date.now()}`; // Generate a simple unique order ID
    const subject = `Pago Orden ${orderId}`;

    // Basic validation (add email check)
    if (!amount || typeof amount !== 'number' || amount <= 0 || !email || typeof email !== 'string') {
       return new Response(JSON.stringify({ error: 'Invalid request body: Missing or invalid amount or email.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Prepare data for Flow API ---
    const params: Record<string, any> = {
      apiKey: FLOW_API_KEY,
      commerceOrder: orderId.toString(), // Unique order ID from your system
      subject: subject,
      currency: 'CLP', // Assuming CLP
      amount: Math.round(amount), // Ensure amount is integer for CLP
      email: email, // Use the email received from the frontend
      paymentMethod: 9, // 9 typically means "all available methods" on Flow, check docs
      urlConfirmation: `${url.origin}/api/flow-confirmation`, // Your endpoint to receive confirmation from Flow
      urlReturn: `${url.origin}/orden-confirmada-flow`, // Where user returns after payment
      // Add optional parameters if needed (e.g., optional)
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
