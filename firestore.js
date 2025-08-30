import { 
  getFirestore 
} from './firebase-init.js';

// Функция для добавления отсканированного товара
export const addScannedItem = async (itemData) => {
  try {
    const db = await getFirestore();
    
    const docRef = await db.collection('scannedItems').add({
      ...itemData,
      timestamp: new Date() // Используем обычную дату вместо serverTimestamp
    });
    return docRef.id;
  } catch (error) {
    console.error('Ошибка добавления товара:', error);
    throw error;
  }
};

// Функция для получения списка отсканированных товаров
export const getScannedItems = async () => {
  try {
    const db = await getFirestore();
    const snapshot = await db.collection('scannedItems')
      .orderBy('timestamp', 'desc')
      .get();
    
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    return items;
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    throw error;
  }
};

// Функция для удаления отсканированного товара
export const deleteScannedItem = async (itemId) => {
  try {
    const db = await getFirestore();
    await db.collection('scannedItems').doc(itemId).delete();
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    throw error;
  }
};

// Функция для получения ожидаемых товаров
export const getExpectedItems = async () => {
  try {
    const db = await getFirestore();
    const snapshot = await db.collection('expectedItems').get();
    
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    return items;
  } catch (error) {
    console.error('Ошибка получения ожидаемых товаров:', error);
    throw error;
  }
};

// Дополнительная функция для real-time обновлений
export const onScannedItemsUpdate = (callback) => {
  try {
    const db = getFirebase().firestore();
    return db.collection('scannedItems')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
      });
  } catch (error) {
    console.error('Ошибка подписки на обновления:', error);
    throw error;
  }
};

export const addExpectedItem = async (itemData) => {
  try {
    const db = await getFirestore();
    
    const docRef = await db.collection('expectedItems').add({
      barcode: itemData.barcode,
      expected: itemData.expected || 0,
      scanned: itemData.scanned || 0,
      productName: itemData.productName || '',
      category: itemData.category || '',
      createdAt: new Date()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Ошибка добавления ожидаемого товара:', error);
    throw error;
  }
};

// Функция для обновления количества отсканированных ожидаемых товаров
export const updateExpectedItem = async (itemId, newScanned) => {
  try {
    const db = await getFirestore();
    await db.collection('expectedItems').doc(itemId).update({
      scanned: newScanned,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Ошибка обновления ожидаемого товара:', error);
    throw error;
  }
};