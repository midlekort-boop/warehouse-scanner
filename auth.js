import { ensureFirebaseInitialized, getFirebaseAuth } from './firebase-init.js';

// Функция входа
export async function loginWithEmail(email, password) {
  try {
    await ensureFirebaseInitialized();
    const auth = getFirebaseAuth();
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    console.log('✅ Вход выполнен:', userCredential.user.email);
    return userCredential;
  } catch (error) {
    console.error('❌ Ошибка входа:', error);
    throw error;
  }
}

// Функция регистрации
export async function registerWithEmail(email, password) {
  try {
    await ensureFirebaseInitialized();
    const auth = getFirebaseAuth();
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    console.log('✅ Регистрация выполнена:', userCredential.user.email);
    return userCredential;
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    throw error;
  }
}

// Функция выхода
export async function logoutUser() {
  try {
    await ensureFirebaseInitialized();
    const auth = getFirebaseAuth();
    await auth.signOut();
    console.log('✅ Выход выполнен');
  } catch (error) {
    console.error('❌ Ошибка выхода:', error);
    throw error;
  }
}

// Слушатель изменения состояния аутентификации
export async function onAuthStateChange(callback) {
  await ensureFirebaseInitialized();
  const auth = getFirebaseAuth();
  return auth.onAuthStateChanged(callback);
}

// Получение текущего пользователя
export async function getCurrentUser() {
  await ensureFirebaseInitialized();
  const auth = getFirebaseAuth();
  return auth.currentUser;
}