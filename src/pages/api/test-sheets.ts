import type { APIRoute } from 'astro';
        import { appendToSheet } from '../../utils/googleSheets';

        // Define el orden EXACTO de las columnas como en tu webhook
        const SHEET_COLUMNS_ORDER = [
          'Nombre', 'Apellido', 'Teléfono', 'Email', 'Dirección',
          'Región', 'Comuna', 'Observación Transportista', 'Fecha Pedido',
          'ID Orden', 'Monto Pagado'
        ];

        export const GET: APIRoute = async () => {
          console.log("Ejecutando prueba de Google Sheets...");
          try {
            // Datos de prueba que coinciden con SHEET_COLUMNS_ORDER
            // El orden en que se devuelven los valores aquí debe coincidir EXACTAMENTE
            // con el orden de las columnas en tu Google Sheet y en SHEET_COLUMNS_ORDER.
            const testData = [
                'Prueba Nombre',                 // Corresponde a 'Nombre'
                'Prueba Apellido',               // Corresponde a 'Apellido'
                '+56912345678',                  // Corresponde a 'Teléfono'
                'test@example.com',              // Corresponde a 'Email'
                'Calle Falsa 123',               // Corresponde a 'Dirección'
                'Testlandia',                    // Corresponde a 'Región'
                'Providencia Test',              // Corresponde a 'Comuna'
                'Es una prueba',                 // Corresponde a 'Observación Transportista'
                new Date().toISOString(),        // Corresponde a 'Fecha Pedido'
                'TEST-ORDER-123',                // Corresponde a 'ID Orden'
                9990                             // Corresponde a 'Monto Pagado'
            ];

            await appendToSheet(testData);
            console.log("Prueba de Google Sheets completada con éxito.");
            return new Response('Prueba de escritura en Google Sheet exitosa. Revisa tu hoja.', { status: 200 });
          } catch (error: any) {
            console.error("Error durante la prueba de Google Sheets:", error);
            return new Response(`Error en la prueba: ${error.message}`, { status: 500 });
          }
        };
