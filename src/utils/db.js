const DB_NAME = 'MetisDB';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

let dbInstance = null;

export function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => reject(event.target.error);
    
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveWallpaperToDB(id, data) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, ...data, timestamp: Date.now() });
    
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getWallpaperFromDB(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteWallpaperFromDB(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}
