/**
 * offlineBoards.js
 *
 * Modo Campo / Funcionalidad Offline (Caso de Estudio 2, sección 2.2):
 * guarda y recupera pizarras tácticas (posiciones + nombre + nota) en
 * IndexedDB, el almacenamiento persistente del navegador. A diferencia de
 * localStorage, IndexedDB no tiene un límite práctico de ~5MB y soporta
 * objetos estructurados directamente, sin serializar/deserializar cada
 * campo a mano -- es más apropiado para ir acumulando muchas pizarras con
 * el tiempo.
 *
 * Todo lo que hay aquí funciona sin conexión a internet: el navegador
 * guarda estos datos en disco local del dispositivo, así que un
 * Entrenador o Analista puede consultar y editar sus pizarras en un
 * camerino o campo de entrenamiento sin cobertura de red, tal como pide
 * el caso de estudio ("Modo Campo / Funcionalidad Offline: conserva las
 * pizarras tácticas, plantillas y esquemas en el almacenamiento del
 * navegador").
 *
 * Guardar en: tactical-sim-frontend/src/components/offlineBoards.js
 * (misma carpeta que TacticalSimulator.jsx, TennisSimulator.jsx, etc.)
 */

const DB_NAME = 'tacticai_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'boards';

function openDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Este navegador no soporta almacenamiento offline (IndexedDB).'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('sport', 'sport', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda la pizarra actual (posiciones + metadatos) en IndexedDB.
 * Devuelve el id autogenerado del registro guardado.
 */
export async function saveLocalBoard({ sport, name, positions, note }) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        sport,
        name: name && name.trim() ? name.trim() : `Pizarra ${new Date().toLocaleString('es-CO')}`,
        positions,
        note: note || '',
        savedAt: new Date().toISOString()
      };
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Devuelve todas las pizarras guardadas localmente para un deporte
 * ('BASKETBALL' o 'TENNIS'), más recientes primero.
 */
export async function getLocalBoards(sport) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('sport');
      const request = index.getAll(sport);
      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Elimina una pizarra guardada localmente por su id.
 */
export async function deleteLocalBoard(id) {
  const db = await openDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}