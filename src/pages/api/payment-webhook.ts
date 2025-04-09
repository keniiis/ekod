import type { APIRoute } from 'astro';
import { appendToSheet } from '../../utils/googleSheets'; // Import the utility

// --- CONFIGURACIÓN IMPORTANTE ---
// 1. Define el nombre exacto de tu hoja en Google Sheets
const SHEET_NAME = 'Hoja 1'; // Ajusta si tu hoja tiene otro nombre

// 2. Define el orden EXACTO de las columnas en tu hoja de Google Sheets
//    Esto es crucial para que los datos se inserten correctamente.
//    Ajusta este array para que coincida con tus encabezados.
const SHEET_COLUMNS_ORDER = [
  'Nombre',
  'Apellido',
  'Teléfono',
  'Email',
  'Dirección',
  'Región',
  'Comuna',
  'Observación Transportista',
  'Fecha Pedido', // Ejemplo: Añade columnas si las tienes
  'ID Orden',     // Ejemplo: Añade columnas si las tienes
  'Monto Pagado'  // Ejemplo: Añade columnas si las tienes
];
// ---------------------------------


// !! SEGURIDAD CRÍTICA !!
// Esta función es un *placeholder*. Debes reemplazarla con la lógica
// de verificación de firma específica de tu pasarela de pago (Flow/Mercado Pago)
// usando tu clave secreta. ¡NO USAR EN PRODUCCIÓN SIN VERIFICACIÓN REAL!
async function verifyWebhookSignature(request: Request, rawBody: string): Promise<boolean> {
  console.warn("¡¡VERIFICACIÓN DE WEBHOOK DESACTIVADA!! Implementar antes de producción.");
  // Ejemplo conceptual para Flow (necesitas la librería crypto y tu secret):
  // const flowSignature = request.headers.get('X-Flow-Signature');
  // const flowTimestamp = request.headers.get('X-Flow-Timestamp'); // Puede ser necesario
  // if (!flowSignature) return false;
  // const crypto = await import('node:crypto');
  // const secret = import.meta.env.FLOW_SECRET_KEY; // Necesitas añadir esto a .env
  // const message = `${flowTimestamp}.${rawBody}`; // O el formato que Flow especifique
  // const computedSignature = crypto.createHmac('sha256', secret).update(message).digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(flowSignature), Buffer.from(computedSignature));

  // Ejemplo conceptual para Mercado Pago:
  // const mpSignature = request.headers.get('x-signature'); // o x-request-signature
  // const mpRequestId = request.headers.get('x-request-id'); // Puede ser necesario
  // // Lógica de verificación de MP usando su SDK o crypto...

  return true; // Devuelve true temporalmente para pruebas
}

// Función para extraer datos del payload (¡Depende 100% de la pasarela!)
// Modifica esto según la estructura real del JSON que envía Flow o Mercado Pago
function extractDataFromPayload(payload: any): Record<string, any> {
   console.log("Payload recibido:", JSON.stringify(payload, null, 2));

   // --- Ejemplo para Flow (estructura hipotética, ¡VERIFICA LA DOCUMENTACIÓN!) ---
   if (payload.token && payload.status !== undefined) { // Podría ser un webhook de Flow
     const statusMapping: { [key: number]: string } = { 1: 'PENDING', 2: 'PAID', 3: 'REJECTED', 4: 'CANCELLED' };
     return {
       isSuccess: payload.status === 2, // 2 = Pagada en Flow
       orderId: payload.commerceOrder || 'N/A',
       paymentId: payload.flowOrder || 'N/A', // ID interno de Flow
       amount: payload.amount || 'N/A',
       currency: payload.currency || 'CLP',
       payerEmail: payload.payer || 'N/A', // Email del pagador si Flow lo provee
       paymentMethod: payload.paymentData?.media || 'N/A', // Ej: 'Webpay', 'MACH'
       status: statusMapping[payload.status] || `UNKNOWN (${payload.status})`,
       timestamp: payload.paymentData?.date || new Date().toISOString(),
       // Otros campos que Flow pueda enviar...
       rawPayload: payload // Guardamos todo por si acaso
     };
   }

   // --- Ejemplo para Mercado Pago (estructura hipotética, ¡VERIFICA LA DOCUMENTACIÓN!) ---
   if (payload.action === 'payment.updated' || payload.type === 'payment') { // Podría ser un webhook de MP
      const paymentData = payload.data || {}; // El ID del pago suele estar aquí
      // NOTA: El webhook de MP a menudo solo notifica el ID.
      // Necesitarías hacer otra llamada a la API de MP para obtener los detalles del pago.
      // GET https://api.mercadopago.com/v1/payments/{paymentData.id}
      console.warn("Webhook de Mercado Pago detectado. Necesitarás obtener detalles completos del pago por separado.");
      return {
         isSuccess: false, // Determinar después de obtener detalles del pago
         orderId: "[PENDING MP DETAILS]", // Necesitas obtenerlo de los detalles del pago (external_reference)
         paymentId: paymentData.id || 'N/A',
         status: "[PENDING MP DETAILS]", // Necesitas obtenerlo de los detalles del pago
         payerEmail: "[PENDING MP DETAILS]",
         amount: "[PENDING MP DETAILS]",
         // ... otros campos necesarios
         needsDetailsFetch: true, // Indicador para buscar detalles
         rawPayload: payload
      };
   }

   // Si no se reconoce la estructura
   console.warn("Estructura de payload de webhook no reconocida.");
   return { isSuccess: false, orderId: 'UNKNOWN', rawPayload: payload };
}


export const POST: APIRoute = async ({ request }) => {
  let rawBody;
  try {
    // 1. OBTENER BODY RAW (Necesario para verificación de firma)
    rawBody = await request.text();

    // 2. VERIFICAR FIRMA (¡IMPLEMENTACIÓN REAL REQUERIDA!)
    const isVerified = await verifyWebhookSignature(request.clone(), rawBody); // Clonar request porque text() consume el body
    if (!isVerified) {
      console.error('Webhook signature verification failed.');
      return new Response('Invalid signature', { status: 401 });
    }
    console.log('Webhook signature verified (o omitida).');

    // 3. PARSEAR JSON (Ahora que está verificado)
    const payload = JSON.parse(rawBody);

    // 4. EXTRAER DATOS RELEVANTES
    const extractedData = extractDataFromPayload(payload);

    // --- Manejo especial para Mercado Pago (si necesita buscar detalles) ---
    if (extractedData.needsDetailsFetch && extractedData.paymentId) {
       console.log(`Mercado Pago: Obteniendo detalles para el pago ${extractedData.paymentId}...`);
       // Aquí harías la llamada a la API de MP: GET /v1/payments/{extractedData.paymentId}
       // const mpPaymentDetails = await fetchMpPaymentDetails(extractedData.paymentId);
       // extractedData.isSuccess = mpPaymentDetails.status === 'approved';
       // extractedData.orderId = mpPaymentDetails.external_reference;
       // extractedData.status = mpPaymentDetails.status;
       // extractedData.payerEmail = mpPaymentDetails.payer?.email;
       // extractedData.amount = mpPaymentDetails.transaction_amount;
       // ... etc ...
       console.error("La obtención de detalles de Mercado Pago no está implementada.");
       // Por ahora, no continuamos si necesitamos buscar detalles
       return new Response('MP Details fetch required but not implemented', { status: 501 });
    }
    // --------------------------------------------------------------------


    // 5. PROCESAR SOLO PAGOS EXITOSOS
    if (extractedData.isSuccess) {
      console.log(`Procesando pago exitoso para Orden ID: ${extractedData.orderId}`);

      // 6. !! PASO CLAVE FALTANTE !!
      //    Aquí es donde deberías buscar los datos COMPLETOS del cliente
      //    (nombre, dirección, teléfono, etc.) que guardaste temporalmente
      //    cuando se inició el pago, usando el 'extractedData.orderId'.
      //    const fullCustomerData = await getOrderDataFromTemporaryStore(extractedData.orderId);
      //    if (!fullCustomerData) {
      //       console.error(`No se encontraron datos para la orden ${extractedData.orderId}`);
      //       return new Response('Order data not found', { status: 404 });
      //    }
      console.warn(`Falta la lógica para recuperar datos completos del cliente para la orden ${extractedData.orderId}`);

      // 7. CONSTRUIR LA FILA PARA GOOGLE SHEETS (Usando datos recuperados + del webhook)
      //    Usamos los datos recuperados (simulados aquí) y complementamos con los del webhook.
      //    El orden DEBE coincidir con SHEET_COLUMNS_ORDER.
      const rowData: (string | number | boolean | null)[] = SHEET_COLUMNS_ORDER.map(columnName => {
         switch (columnName) {
           // --- Datos que DEBERÍAN venir de la recuperación (fullCustomerData) ---
           case 'Nombre': return "[PENDIENTE]"; // fullCustomerData.firstName
           case 'Apellido': return "[PENDIENTE]"; // fullCustomerData.lastName
           case 'Teléfono': return "[PENDIENTE]"; // fullCustomerData.phone (formateado?)
           case 'Dirección': return "[PENDIENTE]"; // fullCustomerData.address
           case 'Región': return "[PENDIENTE]"; // fullCustomerData.region
           case 'Comuna': return "[PENDIENTE]"; // fullCustomerData.commune
           case 'Observación Transportista': return "[PENDIENTE]"; // fullCustomerData.observations
           // --- Datos que pueden venir del webhook o ser generados ---
           case 'Email': return extractedData.payerEmail || "[PENDIENTE]";
           case 'Fecha Pedido': return new Date(extractedData.timestamp || Date.now()).toISOString();
           case 'ID Orden': return extractedData.orderId || 'N/A';
           case 'Monto Pagado': return extractedData.amount || 'N/A';
           // Añade más casos según tus columnas
           default: return null; // Columna no reconocida
         }
      });

      console.log("Datos a enviar a Google Sheets:", rowData);

      // 8. ENVIAR A GOOGLE SHEETS
      await appendToSheet(rowData);
      console.log(`Datos para orden ${extractedData.orderId} enviados a Google Sheets.`);

      // 9. !! LIMPIAR DATOS TEMPORALES !!
      //    await deleteOrderDataFromTemporaryStore(extractedData.orderId);

    } else {
      console.log(`Webhook recibido para Orden ID: ${extractedData.orderId} con estado no exitoso (${extractedData.status}). No se procesa.`);
    }

    // 10. RESPONDER A LA PASARELA
    return new Response('Webhook received successfully', { status: 200 });

  } catch (error: any) {
    console.error('Error procesando webhook:', error);
    console.error('Raw Body:', rawBody); // Log raw body on error for debugging
    return new Response(`Webhook processing error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
};

// Permitir GET si alguna pasarela lo usa para verificar el endpoint al configurarlo
export const GET: APIRoute = async () => {
  console.log('Webhook GET request received.');
  return new Response('Webhook endpoint is active. Use POST for notifications.', { status: 200 });
};
