import fs from 'fs/promises';
import path from 'path';

const TEMP_DIR = path.join(process.cwd(), '.temp_orders');

// Asegura que el directorio temporal exista
async function ensureTempDirExists() {
  try {
    await fs.access(TEMP_DIR);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // El directorio no existe, créalo
      await fs.mkdir(TEMP_DIR, { recursive: true });
      console.log(`Directorio temporal creado en: ${TEMP_DIR}`);
    } else {
      // Otro error al acceder al directorio
      console.error(`Error al verificar el directorio temporal ${TEMP_DIR}:`, error);
      throw error; // Relanzar para detener la operación si es necesario
    }
  }
}

/**
 * Guarda los datos de una orden en un archivo JSON temporal.
 * @param orderId - El ID único de la orden.
 * @param data - El objeto con los datos del cliente a guardar.
 */
export async function saveOrderData(orderId: string, data: Record<string, any>): Promise<void> {
  if (!orderId) {
    throw new Error('orderId no puede estar vacío para guardar datos.');
  }
  await ensureTempDirExists();
  const filePath = path.join(TEMP_DIR, `${orderId}.json`);
  try {
    const jsonData = JSON.stringify(data, null, 2); // Formateado para legibilidad
    await fs.writeFile(filePath, jsonData, 'utf-8');
    console.log(`Datos temporales guardados para orderId ${orderId} en ${filePath}`);
  } catch (error) {
    console.error(`Error al guardar datos temporales para orderId ${orderId}:`, error);
    throw new Error(`No se pudieron guardar los datos temporales para la orden ${orderId}.`);
  }
}

/**
 * Recupera los datos de una orden desde un archivo JSON temporal.
 * @param orderId - El ID único de la orden.
 * @returns El objeto con los datos del cliente, o null si no se encuentra.
 */
export async function getOrderData(orderId: string): Promise<Record<string, any> | null> {
  if (!orderId) {
    console.warn('Se intentó obtener datos con un orderId vacío.');
    return null;
  }
  await ensureTempDirExists(); // Asegura que el directorio exista antes de leer
  const filePath = path.join(TEMP_DIR, `${orderId}.json`);
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    console.log(`Datos temporales leídos para orderId ${orderId} desde ${filePath}`);
    return JSON.parse(jsonData);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // El archivo no existe, lo cual es esperado si la orden no se encontró
      console.log(`No se encontraron datos temporales para orderId ${orderId}.`);
      return null;
    } else {
      // Otro error (ej. JSON inválido, problema de permisos)
      console.error(`Error al leer datos temporales para orderId ${orderId}:`, error);
      // Podrías lanzar un error o simplemente devolver null dependiendo de cómo quieras manejarlo
      return null;
    }
  }
}

/**
 * Elimina el archivo JSON temporal de una orden.
 * @param orderId - El ID único de la orden.
 */
export async function deleteOrderData(orderId: string): Promise<void> {
  if (!orderId) {
    console.warn('Se intentó eliminar datos con un orderId vacío.');
    return;
  }
  await ensureTempDirExists(); // Asegura que el directorio exista antes de intentar eliminar
  const filePath = path.join(TEMP_DIR, `${orderId}.json`);
  try {
    await fs.unlink(filePath);
    console.log(`Datos temporales eliminados para orderId ${orderId} (${filePath})`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // El archivo ya no existe, no es un error crítico en este contexto
      console.log(`El archivo temporal para orderId ${orderId} ya no existía.`);
    } else {
      // Otro error al eliminar
      console.error(`Error al eliminar datos temporales para orderId ${orderId}:`, error);
      // Considera si necesitas relanzar el error
    }
  }
}
