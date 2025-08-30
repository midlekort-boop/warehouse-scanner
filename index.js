import { initializeFirebase } from './modules/firebase-init.js';
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  onAuthStateChange 
} from './modules/auth.js';

// Импортируем полифиллы
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Импортируем стили
import './styles/main.css';

console.log('✅ Скрипт загружен');

// Функция для ожидания полной загрузки DOM
function domReady() {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// Проверяем наличие необходимых элементов DOM
function checkDomElements() {
  const authContainer = document.getElementById('authContainer');
  const appContainer = document.getElementById('appContainer');
  const userEmail = document.getElementById('userEmail');
  
  console.log('Auth container exists:', !!authContainer);
  console.log('App container exists:', !!appContainer);
  console.log('User email element exists:', !!userEmail);
  
  return authContainer && appContainer;
}

// Проверяем загрузку внешних библиотек
function checkExternalLibraries() {
  console.log('Firebase:', typeof firebase);
  console.log('JsBarcode:', typeof JsBarcode);
  console.log('XLSX:', typeof XLSX);
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase не загружен');
    // Покажем сообщение пользователю
    const authContainer = document.getElementById('authContainer');
    if (authContainer) {
      authContainer.innerHTML = `
        <h1>📦 Сканер склада</h1>
        <div class="error-message">
          <p>Ошибка загрузки Firebase. Пожалуйста, обновите страницу.</p>
          <button onclick="window.location.reload()">Обновить страницу</button>
        </div>
      `;
    }
    return false;
  }
  
  return typeof JsBarcode !== 'undefined' && typeof XLSX !== 'undefined';
}

// Функция для ожидания загрузки внешних библиотек
function waitForExternalLibraries() {
  return new Promise((resolve) => {
    const checkLibraries = () => {
      if (typeof firebase !== 'undefined' && 
          typeof JsBarcode !== 'undefined' && 
          typeof XLSX !== 'undefined') {
        resolve();
      } else {
        setTimeout(checkLibraries, 100);
      }
    };
    checkLibraries();
  });
}

// Инициализируем Firebase
function initFirebase() {
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyAbLcTFolqzRdLoKn1H_o8g0WhHiZPd3QI",
      authDomain: "warehouse-scanner-ai123.firebaseapp.com",
      projectId: "warehouse-scanner-ai123",
      storageBucket: "warehouse-scanner-ai123.firebasestorage.app",
      messagingSenderId: "188867148301",
      appId: "1:188867148301:web:38511b45f319c3ad213344"
    };
    
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase инициализирован');
    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
    return false;
  }
}

function setupAuthFormHandlers() {
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  
  console.log('Email input:', emailInput);
  console.log('Password input:', passwordInput);
  console.log('Login button:', loginBtn);
  console.log('Register button:', registerBtn);
  
  if (emailInput && passwordInput && loginBtn && registerBtn) {
    console.log('✅ Все элементы формы найдены');
    
    // Добавляем обработчики
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    
    // Обработка нажатия Enter
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        passwordInput.focus();
      }
    });

    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
    
    return true;
  } else {
    console.error('❌ Не все элементы формы найдены');
    return false;
  }
}

// Обработчики для кнопок
async function handleLogin() {
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;
  
  if (!email || !password) {
    alert('Заполните все поля');
    return;
  }
  
  try {
    // Показываем индикатор загрузки
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Вход...';
    loginBtn.disabled = true;
    
    // Выполняем вход
    await loginWithEmail(email, password);
    
    // Скрываем форму аутентификации и показываем основное приложение
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // Инициализируем основное приложение
    initMainApp();
    
  } catch (error) {
    alert(`Ошибка входа: ${error.message}`);
  } finally {
    // Восстанавливаем кнопку
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = 'Войти';
    loginBtn.disabled = false;
  }
}
  
async function handleRegister() {
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;
  
  if (!email || !password) {
    alert('Заполните все поля');
    return;
  }
  
  try {
    // Показываем индикатор загрузки
    const registerBtn = document.getElementById('registerBtn');
    const originalText = registerBtn.textContent;
    registerBtn.textContent = 'Регистрация...';
    registerBtn.disabled = true;
    
    // Выполняем регистрацию
    await registerWithEmail(email, password);
    alert('Регистрация выполнена успешно! Теперь вы можете войти.');
    
    // Очищаем поля
    document.getElementById('emailInput').value = '';
    document.getElementById('passwordInput').value = '';
    
  } catch (error) {
    alert(`Ошибка регистрации: ${error.message}`);
  } finally {
    // Восстанавливаем кнопку
    const registerBtn = document.getElementById('registerBtn');
    registerBtn.textContent = 'Регистрация';
    registerBtn.disabled = false;
  }
}

// Функция инициализации основного приложения после успешного входа
function initMainApp() {
  console.log('Initializing main application...');
  
  // Проверяем, что основной интерфейс загружен
  const appContainer = document.getElementById('appContainer');
  if (!appContainer) {
    console.error('App container not found!');
    return;
  }
  
  // Добавляем минимальное содержимое для проверки
  appContainer.innerHTML = `
    <div style="padding: 20px;">
      <h1>Основное приложение загружено</h1>
      <p>Добро пожаловать в систему сканирования склада!</p>
      <button onclick="logout()">Выйти</button>
    </div>
  `;
  
  // Здесь будет инициализация всех компонентов приложения
  initializeAppComponents();
}

function initializeAppComponents() {
  console.log('Initializing app components...');
  // Инициализация всех компонентов приложения
}

function updateDashboard() {
  console.log('🔄 Обновление dashboard...');
  const dashboard = document.getElementById('compactDashboard');
  if (dashboard) {
    dashboard.innerHTML = '<div>Dashboard будет здесь</div>';
  }
}

function renderTable() {
  console.log('🔄 Рендер таблицы...');
  const tbody = document.getElementById('dataBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td>Таблица будет здесь</td></tr>';
  }
}

function renderExpectedItems() {
  console.log('🔄 Рендер ожидаемых товаров...');
  const expectedList = document.getElementById('expectedList');
  if (expectedList) {
    // Оставляем заголовок и добавляем тестовый элемент
    expectedList.innerHTML += '<div class="expected-item"><div class="expected-barcode">TEST123</div><div class="expected-quantity">10</div><div class="expected-scanned">0</div><div class="expected-remaining">10</div></div>';
  }
}

function renderHistory() {
  console.log('🔄 Рендер истории...');
  const historyList = document.getElementById('historyList');
  if (historyList) {
    historyList.innerHTML = '<div class="history-item">История будет здесь</div>';
  }
}

function setupAppEventHandlers() {
  console.log('🔄 Настройка обработчиков событий...');
  
  // Добавляем обработчик для кнопки выхода
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
    console.log('✅ Обработчик выхода добавлен');
  }
}

// Создаем форму программно, если она не найдена в DOM
function createAuthForm() {
  const authContainer = document.getElementById('authContainer');
  if (!authContainer) return;
  
  authContainer.innerHTML = `
    <h1>📦 Сканер склада</h1>
    <div class="auth-form">
      <input type="email" id="emailInput" placeholder="Email" required>
      <input type="password" id="passwordInput" placeholder="Пароль" required>
      <button id="loginBtn">Войти</button>
      <button id="registerBtn">Регистрация</button>
    </div>
  `;
  
  // Повторно инициализируем обработчики
  setTimeout(() => setupAuthFormHandlers(), 100);
}

// Основная функция инициализации
async function initApp() {
  console.log('🚀 Инициализация приложения...');
  
  // Ждем полной загрузки DOM
  await domReady();
  console.log('✅ DOM полностью загружен');
  
  // Ждем загрузки внешних библиотек
  await waitForExternalLibraries();
  console.log('✅ Внешние библиотеки загружены');
  
  // Проверяем DOM элементы
  if (!checkDomElements()) {
    return;
  }
  
  // Инициализируем Firebase
  try {
    initializeFirebase();
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
    return;
  }
  
  // Настраиваем обработчики формы
  if (!setupAuthFormHandlers()) {
    return;
  }

  // Проверяем состояние аутентификации
  onAuthStateChange((user) => {
    if (user) {
      console.log('✅ Пользователь авторизован:', user.email);
      document.getElementById('authContainer').style.display = 'none';
      document.getElementById('appContainer').style.display = 'block';
      initMainApp();
    } else {
      console.log('❌ Пользователь не авторизован');
      document.getElementById('authContainer').style.display = 'block';
      document.getElementById('appContainer').style.display = 'none';
    }
  });
  
  console.log('✅ Приложение полностью инициализировано');
}

// Обработчик изменения состояния аутентификации
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? 'user logged in' : 'user logged out');
    
    if (user) {
      // Пользователь авторизован
      console.log('User email:', user.email);
      
      const authContainer = document.getElementById('authContainer');
      const appContainer = document.getElementById('appContainer');
      
      console.log('Auth container:', authContainer);
      console.log('App container:', appContainer);
      
      if (authContainer) authContainer.style.display = 'none';
      if (appContainer) appContainer.style.display = 'block';
      
      // Покажем email пользователя в интерфейсе
      const userEmailElement = document.getElementById('userEmail');
      if (userEmailElement) {
        userEmailElement.textContent = user.email;
      }
      
      // Инициализируем основное приложение
      initMainApp();
    } else {
      // Пользователь не авторизован
      const authContainer = document.getElementById('authContainer');
      const appContainer = document.getElementById('appContainer');
      
      if (authContainer) authContainer.style.display = 'block';
      if (appContainer) appContainer.style.display = 'none';
    }
  });
}

// Запускаем приложение
initApp();