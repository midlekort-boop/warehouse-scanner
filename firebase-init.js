// Инициализация Firebase
let firebaseApp = null;
let isInitializing = false;
let initializationPromise = null;

export function initializeFirebase() {
  if (initializationPromise) {
    return initializationPromise;
  }
  
  isInitializing = true;
  initializationPromise = new Promise((resolve, reject) => {
    try {
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase не загружен');
      }

      // Проверяем, не инициализирован ли Firebase уже
      if (firebase.apps.length === 0) {
        const firebaseConfig = {
          apiKey: "AIzaSyAbLcTFolqzRdLoKn1H_o8g0WhHiZPd3QI",
          authDomain: "warehouse-scanner-ai123.firebaseapp.com",
          projectId: "warehouse-scanner-ai123",
          storageBucket: "warehouse-scanner-ai123.firebasestorage.app",
          messagingSenderId: "188867148301",
          appId: "1:188867148301:web:38511b45f319c3ad213344"
        };

        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase инициализирован');
      } else {
        firebaseApp = firebase.app();
        console.log('✅ Firebase уже инициализирован');
      }
      
      isInitializing = false;
      resolve(firebaseApp);
    } catch (error) {
      isInitializing = false;
      console.error('❌ Ошибка инициализации Firebase:', error);
      reject(error);
    }
  });
  
  return initializationPromise;
}

export function getFirebaseApp() {
  if (!firebaseApp && !isInitializing) {
    throw new Error('Firebase не инициализирован. Сначала вызовите initializeFirebase()');
  }
  return firebaseApp;
}

export async function ensureFirebaseInitialized() {
  if (!firebaseApp && !isInitializing) {
    await initializeFirebase();
  } else if (isInitializing) {
    await initializationPromise;
  }
  return firebaseApp;
}

export function getFirebaseAuth() {
  return getFirebaseApp().auth();
}

export function getFirebaseFirestore() {
  return getFirebaseApp().firestore();
}