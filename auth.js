import { 
  initializeFirebase, 
  getFirebaseAuth 
} from './firebase-init.js';

// Функция входа
export const loginWithEmail = async (email, password) => {
  try {
    const auth = await getFirebaseAuth();
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Ошибка входа:', error);
    throw error;
  }
};

// Функция регистрации
export const registerWithEmail = async (email, password) => {
  try {
    const auth = await getFirebaseAuth();
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    throw error;
  }
};

// Функция выхода
export const logoutUser = async () => {
  try {
    const auth = await getFirebaseAuth();
    await auth.signOut();
  } catch (error) {
    console.error('Ошибка выхода:', error);
    throw error;
  }
};

export const onAuthStateChange = async (callback) => {
  const auth = await getFirebaseAuth();
  return auth.onAuthStateChanged(callback);
};