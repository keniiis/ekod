import type { APIRoute } from 'astro';
import { appendToSheet } from '../../utils/googleSheets';
import { getOrderData, deleteOrderData } from '../../utils/tempOrderStore';
import crypto from 'node:crypto'; // Necesario para verificación de Flow
import { MercadoPagoConfig, Payment } from 'mercadopago'; // Para obtener detalles de MP

// --- CONFIGURACIÓN IMPORTANTE ---
const MERCADO_PAGO_ACCESS_TOKEN = import.meta.env.MERCADO_PAGO_ACCESS_TOKEN; // Necesario para API
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


// Variables de entorno para las claves secretas
const FLOW_SECRET_KEY = import.meta.env.FLOW_SECRET_KEY;
const MP_WEBHOOK_SECRET = import.meta.env.MP_WEBHOOK_SECRET; // Necesitarás configurar esto en MP y aquí

// !! SEGURIDAD CRÍTICA !!
// Verifica la firma del webhook según la pasarela de origen.
// AHORA ACEPTA EL PAYLOAD PARSEADO PARA LA VERIFICACIÓN DE MP.
async function verifyWebhookSignature(request: Request, rawBody: string, payload: any): Promise<boolean> {
  const flowSignature = request.headers.get('X-Flow-Signature');
  const mpSignatureHeader = request.headers.get('x-signature'); // Cabecera de MP

  // Determinar la fuente basado en cabeceras o estructura inicial del payload si es necesario
  const source = mpSignatureHeader ? 'mercadopago' : (flowSignature ? 'flow' : 'unknown');

  if (source === 'flow' && flowSignature && FLOW_SECRET_KEY) {
    // --- Verificación para Flow ---
    console.log("Verificando firma de Flow...");
    // Flow usualmente envía el token en el body POST, no rawBody directamente para firma.
    // Necesitamos parsear el body como x-www-form-urlencoded
    let params: Record<string, string> = {};
    try {
        const urlParams = new URLSearchParams(rawBody);
        urlParams.forEach((value, key) => {
            if (key !== 's') { // Excluir la firma misma del cálculo
                params[key] = value;
            }
        });
    } catch (e) {
        console.error("Error parseando body para verificación de Flow:", e);
        return false;
    }

    const sortedKeys = Object.keys(params).sort();
    const sortedParamsString = sortedKeys.map(key => `${key}${params[key]}`).join('');
    const expectedSignature = crypto.createHmac('sha256', FLOW_SECRET_KEY)
                                     .update(sortedParamsString)
                                     .digest('hex');

    const isValid = crypto.timingSafeEqual(Buffer.from(flowSignature), Buffer.from(expectedSignature));
    console.log(`Firma Flow válida: ${isValid}`);
    return isValid;

  } else if (mpSignatureHeader && MP_WEBHOOK_SECRET) {
    // --- Verificación para Mercado Pago ---
    console.log("Verificando firma de Mercado Pago...");
    const requestId = request.headers.get('x-request-id'); // MP usa x-request-id
    const signatureParts = mpSignatureHeader.split(',');
    const receivedSig = signatureParts.find(part => part.startsWith('sig1='))?.split('=')[1];
    const receivedTs = signatureParts.find(part => part.startsWith('ts='))?.split('=')[1];

    if (!receivedSig || !receivedTs || !requestId) {
        console.error("Faltan partes en la cabecera x-signature o x-request-id de MP.");
        return false;
    }

    // Extraer el ID del evento/pago DESDE EL PAYLOAD PARSEADO
    const eventOrPaymentId = payload?.data?.id || payload?.id; // Intentar obtenerlo de data.id o id
    if (!eventOrPaymentId) {
        console.error("No se pudo extraer el ID del evento/pago del payload de MP para la verificación.");
        return false;
    }

    // Crear el contenido firmado según la documentación de MP
    const signedContent = `id:${eventOrPaymentId};request-id:${requestId};ts:${receivedTs};`;
    console.log("Contenido firmado para MP:", signedContent);

    const expectedSignature = crypto.createHmac('sha256', MP_WEBHOOK_SECRET)
                                   .update(signedContent)
                                   .digest('hex');

    // Comparación segura contra ataques de timing
    const isValid = crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSignature));
    console.log(`Firma MP válida: ${isValid}`);
    return isValid;

  } else if (source === 'unknown') {
     console.error('No se encontró firma válida (Flow o MP) o falta la clave secreta en .env');
     return false; // No hay firma reconocible o falta configuración
  }

  // Si llegó aquí, es una fuente conocida pero falta la firma o la clave secreta
  console.error(`Falta la firma o la clave secreta para la fuente: ${source}`);
  return false;
// } // <-- Eliminar esta llave extra
}

// Función para extraer datos del payload y determinar el origen
// Devuelve un objeto con datos normalizados y la fuente ('flow' o 'mercadopago')
function extractDataFromPayload(payload: any): Record<string, any> & { source: 'flow' | 'mercadopago' | 'unknown' } {
   console.log("Payload recibido en webhook:", JSON.stringify(payload, null, 2));

   // --- Detección y extracción para Flow ---
   // Flow envía los datos directamente en el payload del webhook POST x-www-form-urlencoded
   // Nota: Si usas urlConfirmation, el payload puede ser diferente que si usas la notificación directa.
   // Asumiremos que viene de urlConfirmation con 'token' como identificador clave.
   if (typeof payload.token === 'string' && typeof payload.status === 'string') {
     console.log("Detectado payload de Flow.");
     const flowStatus = parseInt(payload.status, 10);
     const statusMapping: { [key: number]: string } = { 1: 'PENDING', 2: 'PAID', 3: 'REJECTED', 4: 'CANCELLED' };
     return {
       source: 'flow',
       isSuccess: flowStatus === 2, // 2 = Pagada en Flow
       orderId: payload.commerceOrder || 'N/A', // Este es nuestro ID interno
       paymentId: payload.flowOrder || 'N/A', // ID interno de Flow
       amount: parseFloat(payload.amount) || 0,
       currency: 'CLP', // Flow Chile usualmente es CLP
       payerEmail: payload.payer || 'N/A',
       paymentMethod: payload.media || 'N/A', // 'media' suele estar en el nivel superior
       status: statusMapping[flowStatus] || `UNKNOWN (${payload.status})`,
       timestamp: payload.paymentDate || new Date().toISOString(), // 'paymentDate' o 'date'
       needsDetailsFetch: false, // Flow envía todo en el webhook
       rawPayload: payload
     };
   }

   // --- Detección y extracción para Mercado Pago ---
   // MP envía un JSON con 'action' y 'type', y el ID del pago en 'data.id'
   if ((payload.action?.startsWith('payment.') || payload.type === 'payment') && payload.data?.id) {
      console.log("Detectado payload de Mercado Pago.");
      return {
         source: 'mercadopago',
         isSuccess: false, // Se determinará después de obtener detalles
         orderId: "[PENDING MP DETAILS]", // Se obtendrá de external_reference
         paymentId: payload.data.id, // ID del pago de MP
         status: "[PENDING MP DETAILS]",
         payerEmail: "[PENDING MP DETAILS]",
         amount: "[PENDING MP DETAILS]",
         currency: "[PENDING MP DETAILS]",
         paymentMethod: "[PENDING MP DETAILS]",
         timestamp: payload.date_created || new Date().toISOString(), // Fecha de creación del evento
         needsDetailsFetch: true, // Indicar que necesitamos buscar detalles
         rawPayload: payload
      };
   }

   // --- Si no se reconoce ---
   console.warn("Estructura de payload de webhook no reconocida.");
   return { source: 'unknown', isSuccess: false, orderId: 'UNKNOWN', rawPayload: payload };
}


export const POST: APIRoute = async ({ request }) => {
  let rawBody;
  try {
    // 1. OBTENER BODY RAW (Necesario para verificación de firma)
    rawBody = await request.text();

    // 3. PARSEAR JSON PRIMERO (Necesario para verificación de MP)
    let payload: any;
    try {
        // Flow envía x-www-form-urlencoded, MP envía JSON. Intentar parsear ambos.
        if (request.headers.get('content-type')?.includes('application/json')) {
            payload = JSON.parse(rawBody);
        } else if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
            const urlParams = new URLSearchParams(rawBody);
            payload = {};
            urlParams.forEach((value, key) => { payload[key] = value });
        } else {
            // Asumir JSON si no hay Content-Type claro o es desconocido
             console.warn(`Content-Type no reconocido (${request.headers.get('content-type')}), intentando parsear como JSON.`);
             payload = JSON.parse(rawBody);
        }
    } catch (parseError: any) {
        console.error('Error parseando el body del webhook:', parseError);
        console.error('Raw Body con error de parseo:', rawBody);
        return new Response(`Invalid request body: ${parseError.message}`, { status: 400 });
    }


    // 2. VERIFICAR FIRMA (Pasando el payload parseado)
    const isVerified = await verifyWebhookSignature(request.clone(), rawBody, payload); // Clonar request, pasar rawBody y payload
    if (!isVerified) {
      console.error('Webhook signature verification failed.');
      return new Response('Invalid signature', { status: 401 });
    }
    console.log('Webhook signature verified (o omitida).');

    // payload YA FUE PARSEADO antes de llamar a verifyWebhookSignature

    // 4. EXTRAER DATOS RELEVANTES (usando el payload ya parseado)
    const extractedData = extractDataFromPayload(payload);

    // --- Manejo especial para Mercado Pago (si necesita buscar detalles) ---
    if (extractedData.source === 'mercadopago' && extractedData.needsDetailsFetch && extractedData.paymentId) {
      console.log(`Mercado Pago: Obteniendo detalles para el pago ${extractedData.paymentId}...`);

      if (!MERCADO_PAGO_ACCESS_TOKEN) {
        console.error("Error crítico: Falta MERCADO_PAGO_ACCESS_TOKEN para obtener detalles de MP.");
        return new Response('Server configuration error: MP Access Token missing.', { status: 500 });
      }

      try {
        // Inicializar cliente MP aquí si no se hizo globalmente o si se prefiere por request
        const mpClient = new MercadoPagoConfig({ accessToken: MERCADO_PAGO_ACCESS_TOKEN });
        const payment = new Payment(mpClient);

        const mpPaymentDetails = await payment.get({ id: extractedData.paymentId });
        console.log("Detalles del pago MP obtenidos:", mpPaymentDetails);

        if (mpPaymentDetails) {
          // Actualizar extractedData con los detalles obtenidos
          extractedData.isSuccess = mpPaymentDetails.status === 'approved';
          extractedData.orderId = mpPaymentDetails.external_reference || extractedData.orderId; // Usar external_reference como nuestro orderId
          extractedData.status = mpPaymentDetails.status || extractedData.status;
          extractedData.payerEmail = mpPaymentDetails.payer?.email || extractedData.payerEmail;
          extractedData.amount = mpPaymentDetails.transaction_amount || extractedData.amount;
          extractedData.currency = mpPaymentDetails.currency_id || extractedData.currency;
          extractedData.paymentMethod = mpPaymentDetails.payment_method_id || extractedData.paymentMethod;
          extractedData.timestamp = mpPaymentDetails.date_approved || mpPaymentDetails.date_created || extractedData.timestamp; // Usar fecha de aprobación si existe
          extractedData.needsDetailsFetch = false; // Ya no necesitamos buscar detalles
        } else {
          console.error(`No se encontraron detalles para el pago MP ${extractedData.paymentId}`);
          // Considerar cómo manejar esto. ¿Quizás el pago no existe?
          // Devolver un error podría ser apropiado para investigar.
          return new Response(`Failed to fetch details for MP payment ${extractedData.paymentId}`, { status: 404 });
        }

      } catch (mpError: any) {
        console.error(`Error al obtener detalles del pago MP ${extractedData.paymentId}:`, mpError);
        // Devolver un error para que MP pueda reintentar el webhook si es configurado
        return new Response(`Error fetching MP payment details: ${mpError.message}`, { status: 500 });
      }
    }
    // --------------------------------------------------------------------


    // 5. PROCESAR SOLO PAGOS EXITOSOS
    if (extractedData.isSuccess) {
      console.log(`Procesando pago exitoso para Orden ID: ${extractedData.orderId}`);

      // 6. RECUPERAR DATOS COMPLETOS DEL CLIENTE DESDE ALMACENAMIENTO TEMPORAL
      const fullCustomerData = await getOrderData(extractedData.orderId);

      if (!fullCustomerData) {
         console.error(`CRÍTICO: No se encontraron datos temporales para la orden ${extractedData.orderId} después de un pago exitoso.`);
         // Considera qué hacer aquí. ¿Enviar a Sheets con datos incompletos? ¿Devolver error?
         // Por ahora, devolveremos un error para indicar el problema.
         return new Response(`Order data not found for ${extractedData.orderId}`, { status: 404 });
      }
      console.log(`Datos completos recuperados para la orden ${extractedData.orderId}:`, fullCustomerData);

      // 7. CONSTRUIR LA FILA PARA GOOGLE SHEETS (Usando datos recuperados + del webhook)
      //    El orden DEBE coincidir con SHEET_COLUMNS_ORDER.
      //    Asegúrate de que los nombres de campo (ej. fullCustomerData.firstName) coincidan
      //    con los que guardas en el endpoint create-preference.
      const rowData: (string | number | boolean | null)[] = SHEET_COLUMNS_ORDER.map(columnName => {
         switch (columnName) {
           // --- Datos recuperados del almacenamiento temporal ---
           case 'Nombre': return fullCustomerData.firstName || fullCustomerData.nombre || "[FALTA]";
           case 'Apellido': return fullCustomerData.lastName || fullCustomerData.apellido || "[FALTA]";
           case 'Teléfono': return fullCustomerData.phone || fullCustomerData.telefono || "[FALTA]";
           case 'Dirección': return fullCustomerData.address || fullCustomerData.direccion || "[FALTA]";
           case 'Región': return fullCustomerData.region || fullCustomerData.region || "[FALTA]";
           case 'Comuna': return fullCustomerData.commune || fullCustomerData.comuna || "[FALTA]";
           case 'Observación Transportista': return fullCustomerData.observations || fullCustomerData.observacion || ""; // Puede ser vacío
           // --- Datos del webhook o generados ---
           case 'Email': return fullCustomerData.email || extractedData.payerEmail || "[FALTA]"; // Prioriza el email del formulario
           case 'Fecha Pedido': return new Date(extractedData.timestamp || Date.now()).toISOString();
           case 'ID Orden': return extractedData.orderId || 'N/A';
           case 'Monto Pagado': return extractedData.amount || 'N/A';
           default: return null; // Columna no reconocida
         }
      });

      console.log("Datos a enviar a Google Sheets:", rowData);

      // 8. ENVIAR A GOOGLE SHEETS
      await appendToSheet(rowData);
      console.log(`Datos para orden ${extractedData.orderId} enviados a Google Sheets.`);

      // 9. LIMPIAR DATOS TEMPORALES (¡Importante!)
      await deleteOrderData(extractedData.orderId);

    } else {
      console.log(`Webhook recibido para Orden ID: ${extractedData.orderId} con estado no exitoso (${extractedData.status}). No se procesa.`);
      // Considera si quieres eliminar datos temporales también para pagos fallidos/pendientes
      // await deleteOrderData(extractedData.orderId);
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
