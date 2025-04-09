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
            const testData = SHEET_COLUMNS_ORDER.map(col => {
                switch(col) {
                    case 'Nombre': return 'Prueba Nombre';
                    case 'Apellido': return 'Prueba Apellido';
                    case 'Teléfono': return '+56912345678';
                    case 'Email': return 'test@example.com';
                    case 'Dirección': return 'Calle Falsa 123';
                    case 'Región': return 'Testlandia';
                    case 'Comuna': return 'Providencia Test';
                    case 'Observación Transportista': return 'Es una prueba';
                    case 'Fecha Pedido': return new Date().toISOString();
                    case 'ID Orden': return 'TEST-ORDER-123';
                    case 'Monto Pagado': return 9990;
                    default: return `Test ${col}`;
                }
            });

            await appendToSheet(testData);
            console.log("Prueba de Google Sheets completada con éxito.");
            return new Response('Prueba de escritura en Google Sheet exitosa. Revisa tu hoja.', { status: 200 });
          } catch (error: any) {
            console.error("Error durante la prueba de Google Sheets:", error);
            return new Response(`Error en la prueba: ${error.message}`, { status: 500 });
          }
        };
