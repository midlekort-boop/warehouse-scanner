import { loadFirebase } from './firebase-loader.js';

let firebaseApp = null;

export const initializeFirebase = async () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const firebase = await loadFirebase();
    
    const firebaseConfig = {
      apiKey: "AIzaSyAbLcTFolqzRdLoKn1H_o8g0WhHiZPd3QI",
      authDomain: "warehouse-scanner-ai123.firebaseapp.com",
      projectId: "warehouse-scanner-ai123",
      storageBucket: "warehouse-scanner-ai123.firebasestorage.app",
      messagingSenderId: "188867148301",
      appId: "1:188867148301:web:38511b45f319c3ad213344"
    };
    
    // Инициализируем только если еще не инициализирован
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.app();
    }
    
    console.log('✅ Firebase инициализирован');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
    throw error;
  }
};

export const getFirebase = async () => {
  if (!firebaseApp) {
    return await initializeFirebase();
  }
  return firebaseApp;
};

export const getFirebaseAuth = async () => {
  const app = await getFirebase();
  return app.auth();
};

export const getFirestore = async () => {
  const app = await getFirebase();
  return app.firestore();
};