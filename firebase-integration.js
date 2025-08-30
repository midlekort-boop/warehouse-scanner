// Инициализация Firebase (будет доступен глобально через CDN)

const firebaseConfig = {
  apiKey: "AIzaSyAbLcTFolqzRdLoKn1H_o8g0WhHiZPd3QI",
  authDomain: "warehouse-scanner-ai123.firebaseapp.com",
  projectId: "warehouse-scanner-ai123",
  storageBucket: "warehouse-scanner-ai123.firebasestorage.app",
  messagingSenderId: "188867148301",
  appId: "1:188867148301:web:38511b45f319c3ad213344"
};

// Инициализируем Firebase
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase инициализирован");
    
    // Экспортируем сервисы Firebase для использования в модулях
    window.firebaseApp = firebase.app();
    window.firebaseAuth = firebase.auth();
    window.firebaseFirestore = firebase.firestore();
  } else {
    console.error("Firebase не загружен. Проверьте подключение CDN.");
  }
} catch (error) {
  console.error("❌ Ошибка инициализации Firebase:", error);
}

// Экспортируем для использования в других модулях
export const getFirebaseAuth = () => window.firebaseAuth;
export const getFirebaseFirestore = () => window.firebaseFirestore;
export const getFirebaseApp = () => window.firebaseApp;