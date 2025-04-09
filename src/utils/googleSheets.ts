import { google } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises'; // Usamos fs/promises para async/await

// Asegúrate de que las variables de entorno estén definidas
const SPREADSHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
const CREDENTIALS_PATH = import.meta.env.GOOGLE_CREDENTIALS_PATH;
const SHEET_NAME = 'Hoja 1'; // O el nombre exacto de tu hoja si lo cambiaste

if (!SPREADSHEET_ID || !CREDENTIALS_PATH) {
  console.error('Error: GOOGLE_SHEET_ID or GOOGLE_CREDENTIALS_PATH environment variables are not set.');
  // Podrías lanzar un error aquí si prefieres detener la ejecución
  // throw new Error('Missing Google Sheets environment variables.');
}

async function getAuthClient() {
  try {
    // Lee las credenciales del archivo especificado en .env
    const credentialsContent = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsContent);

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Permiso para editar hojas de cálculo
    });
    const authClient = await auth.getClient();
    return authClient;
  } catch (error) {
    console.error('Error loading Google credentials or creating auth client:', error);
    throw new Error('Failed to authenticate with Google Sheets API.');
  }
}

async function getSheetsApi() {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient as OAuth2Client });
  return sheets;
}

/**
 * Añade una fila de datos a la hoja de cálculo especificada.
 * @param data - Un array de valores en el orden de las columnas de tu hoja.
 *               Ej: ['Juan', 'Perez', '+569...', 'juan@...', 'Calle Falsa 123', 'Metropolitana', 'Santiago', 'Dejar en conserjería', '2025-04-08']
 */
export async function appendToSheet(data: (string | number | boolean | null)[]) {
  if (!SPREADSHEET_ID) {
    console.error('Cannot append to sheet: SPREADSHEET_ID is not configured.');
    return; // O lanzar un error
  }

  try {
    const sheets = await getSheetsApi();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`, // Añade después de la última fila con datos en la Hoja 1
      valueInputOption: 'USER_ENTERED', // Interpreta los datos como si un usuario los escribiera
      requestBody: {
        values: [data], // Los datos deben estar dentro de otro array
      },
    });
    console.log('Data appended successfully to Google Sheet:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error appending data to Google Sheet:', error.message || error);
    // Podrías querer manejar errores específicos de la API aquí
  }
}
