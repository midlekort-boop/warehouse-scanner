// Core modules
import { initializeFirebase } from './modules/firebase-init.js';

// Auth
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  onAuthStateChange 
} from './modules/auth.js';

// Firestore
import { 
  addScannedItem, 
  getScannedItems, 
  deleteScannedItem, 
  getExpectedItems,
  addExpectedItem 
} from './modules/firestore.js';

// Import/Export
import {
  readExcelFile,
  importToFirestore,
  exportToExcel
} from './modules/import-export.js';

// Notifications
import {
  showSuccess,
  showError,
  showMessage
} from './modules/notifications.js';

// Rendering
import {
  renderTable,
  renderExpectedItems
} from './modules/render.js';

// Barcode
import {
  printBarcode,
  generateBarcodeSvg
} from './modules/barcode.js';

// Scanner
import {
  setupScannerHandlers,
  handleScanInput,
  clearScannerInput,
  simulateBarcodeScan
} from './modules/scanner.js';

// UI Update
import {
  updateCurrentBarcode,
  updateDashboardStats,
  resetUI
} from './modules/ui-update.js';

// Polyfills and styles
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './styles/main.css';
// Импортируем полифиллы
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Импортируем стили
import './styles/main.css';

// Явно отключаем HMR
if (module.hot) {
  module.hot.decline();
}

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
  
  console.log('Auth container exists:', !!authContainer);
  console.log('App container exists:', !!appContainer);
  
  return authContainer && appContainer;
}

// Проверяем загрузку внешних библиотек
function checkExternalLibraries() {
  console.log('Firebase:', typeof firebase);
  console.log('JsBarcode:', typeof JsBarcode);
  console.log('XLSX:', typeof XLSX);
  
  return typeof firebase !== 'undefined' && 
         typeof JsBarcode !== 'undefined' && 
         typeof XLSX !== 'undefined';
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

// Настраиваем обработчики формы
function setupAuthFormHandlers() {
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  
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
    loginBtn.textContent = 'Вход...';
    loginBtn.disabled = true;
    
    // Выполняем вход
    await loginWithEmail(email, password);
    
    // Скрываем форму аутентификации и показываем основное приложение
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
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

async function handleLogout() {
  try {
    await logoutUser();
    document.getElementById('authContainer').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
  } catch (error) {
    console.error('Ошибка выхода:', error);
    alert(`Ошибка выхода: ${error.message}`);
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
  // Загружаем данные
  loadData();
  
  // Добавляем real-time listeners
  setupRealTimeListeners();
}
  
  // Загружаем полный интерфейс приложения
  appContainer.innerHTML = `
    <!-- Хедер -->
    <header class="header">
      <div class="header-title">
        <h1>📦 Сканер склада</h1>
        <div class="device-id-header">Устройство: ${generateDeviceId()}</div>
      </div>
      <div class="user-info">
        <span id="userEmail">${firebase.auth().currentUser?.email || 'Пользователь'}</span>
        <button class="logout-btn">Выйти</button>
      </div>
    </header>

    <!-- Основной враппер -->
    <div class="main-wrapper">
      <!-- Левая панель -->
      <aside class="left-sidebar">
        <div class="expected-items-panel">
          <h4>Ожидаемые товары</h4>
          <div class="search-box">
            <input type="text" placeholder="Поиск по штрихкоду...">
            <button class="clear-filter-btn-small">×</button>
          </div>
          <div class="expected-header">
            <span class="col-barcode">Штрихкод</span>
            <span class="col-expected">Ожидается</span>
            <span class="col-scanned">Отсканировано</span>
            <span class="col-remaining">Осталось</span>
          </div>
          <div class="expected-list" id="expectedList">
            <!-- Сюда будут добавляться ожидаемые товары -->
          </div>
        </div>
      </aside>

      <!-- Основное содержание -->
      <main class="main-content">
        <!-- Дашборд -->
        <div id="compactDashboard" class="compact-dashboard">
          <div class="dashboard-grid">
            <div class="stat-card primary">
              <div class="stat-value">0</div>
              <div class="stat-label">Всего отсканировано</div>
              <div class="stat-subtext">за сегодня</div>
            </div>
            <div class="stat-card success">
              <div class="stat-value">0</div>
              <div class="stat-label">Уникальных товаров</div>
              <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
            </div>
            <div class="stat-card info">
              <div class="stat-value">0%</div>
              <div class="stat-label">Выполнение плана</div>
              <div class="stat-subtext">от ожидаемых</div>
            </div>
          </div>
        </div>

        <!-- Текущая информация -->
        <div class="current-info">
          <div class="current-values">
            <div class="current-item">
              <span class="current-label">Текущий штрихкод:</span>
              <span class="current-value" id="currentBarcode">-</span>
            </div>
            <div class="current-item">
              <span class="current-label">Количество:</span>
              <input type="number" id="quantityInput" value="1" min="1" class="current-value" style="width: 60px;">
            </div>
          </div>
          <div class="prefix-settings">
            <div class="prefix-group">
              <label>Префикс 1</label>
              <input type="text" class="prefix-input" placeholder="AAA">
            </div>
            <div class="prefix-group">
              <label>Префикс 2</label>
              <input type="text" class="prefix-input" placeholder="BBB">
            </div>
          </div>
          <div class="print-section">
            <button class="print-btn" onclick="printBarcode()">Печать штрихкода</button>
          </div>
        </div>

        <!-- Область сканирования -->
        <div class="scan-area">
          <div class="scan-input-container">
            <input type="text" id="scanInput" placeholder="Отсканируйте штрихкод или введите вручную..." autocomplete="off">
            <button onclick="clearScan()">Очистить</button>
          </div>
        </div>

        <!-- Управление таблицей -->
        <div class="table-controls">
          <div class="filter-container">
            <input type="text" class="filter-input" placeholder="Фильтр по штрихкоду...">
            <button class="clear-filter-btn-small">×</button>
          </div>
          <div class="view-toggle">
            <button class="active">Все</button>
            <button>Только сегодня</button>
          </div>
        </div>

        <!-- Таблица данных -->
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th data-sort="barcode">Штрихкод</th>
                <th data-sort="quantity">Количество</th>
                <th data-sort="timestamp">Время</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody id="dataBody">
              <!-- Сюда будут добавляться данные -->
              <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #718096;">
                  Нет отсканированных товаров
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div class="pagination">
          <div class="pagination-info">Показано 0 из 0 записей</div>
          <div class="pagination-controls">
            <button disabled>Назад</button>
            <span>Страница 1</span>
            <button disabled>Вперед</button>
          </div>
        </div>
      </main>

      <!-- Правая панель -->
      <aside class="right-sidebar">
        <div class="device-info">
          <h4>ID устройства</h4>
          <div>${generateDeviceId()}</div>
        </div>
        
        <div class="control-buttons">
          <button class="btn-blue" onclick="importData()">Импорт из Excel</button>
          <button class="btn-blue" onclick="exportData()">Экспорт в Excel</button>
          <button class="btn-red" onclick="clearAllData()">Очистить все данные</button>
        </div>

        <div class="print-controls">
          <h4>Настройки печати</h4>
          <div class="print-type">
            <label>Тип штрихкода</label>
            <select>
              <option>CODE128</option>
              <option>EAN-13</option>
              <option>QR Code</option>
            </select>
          </div>
          <div class="print-options">
            <div class="print-option">
              <input type="checkbox" id="showText" checked>
              <label for="showText">Показывать текст</label>
            </div>
            <div class="print-option">
              <input type="checkbox" id="showBorder" checked>
              <label for="showBorder">Рамка</label>
            </div>
          </div>
        </div>

        <div class="history-section">
          <h4>История изменений</h4>
          <div class="history-list" id="historyList">
            <div class="history-item">
              <div>${new Date().toLocaleTimeString()}</div>
              <div>Приложение запущено</div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Контейнер для ошибок -->
    <div class="error-container" id="errorContainer"></div>
  `;

  // Инициализируем обработчики событий
  setupAppEventHandlers();
  
  // Загружаем данные
  loadData();
}

// Вспомогательная функция для генерации ID устройства
function generateDeviceId() {
  return 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
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
    await initializeFirebase();
    console.log('✅ Firebase успешно инициализирован');
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

// Запускаем приложение
initApp();

window.logout = async function() {
  try {
    await logoutUser();
    document.getElementById('authContainer').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
    resetUI(); // ← Сбрасываем UI при выходе
  } catch (error) {
    console.error('Ошибка выхода:', error);
    showError('Ошибка выхода: ' + error.message);
  }
};
  
  // Обработчик выхода
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
function setupAppEventHandlers() {
  // Обработчик сканирования штрихкодов (из scanner.js)
  setupScannerHandlers();
  
  // Обработчик выхода
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  console.log('✅ Обработчики событий инициализированы');
}

function updateDashboard() {
  // Здесь будет логика обновления статистики
  console.log('Обновление дашборда...');
}

async function loadData() {
  console.log('Загрузка данных...');
  
  try {
    // Загружаем отсканированные товары
    const scannedItems = await getScannedItems();
    renderTable(scannedItems);
    updateDashboardStats(scannedItems);
    
    // Загружаем ожидаемые товары
    const expectedItems = await getExpectedItems();
    renderExpectedItems(expectedItems);
    
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    showError('Ошибка загрузки данных');
  }
}

function setupRealTimeListeners() {
  try {
    const db = firebase.firestore();
    
    // Real-time обновление отсканированных товаров
    db.collection('scannedItems')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        renderTable(items);
        updateDashboardStats(items);
      });
    
    // Real-time обновление ожидаемых товаров
    db.collection('expectedItems')
      .onSnapshot((snapshot) => {
        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        renderExpectedItems(items);
      });
      
    console.log('✅ Real-time listeners установлены');
  } catch (error) {
    console.error('❌ Ошибка настройки real-time listeners:', error);
  }
}

// Глобальные функции для кнопок
window.deleteItem = async function(itemId) {
  if (confirm('Удалить этот товар?')) {
    try {
      await deleteScannedItem(itemId);
      showSuccess('Товар удален');
    } catch (error) {
      showError('Ошибка удаления товара');
    }
  }
};

window.importData = async function() {
  // Создаем input для выбора файла
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls,.csv,.xlsm';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        showMessage('Начинаем импорт данных...', 'info');
        
        // Читаем файл
        const data = await readExcelFile(file);
        
        if (!data || data.length === 0) {
          showError('Файл не содержит данных или неправильный формат');
          return;
        }
        
        showMessage(`Обнаружено ${data.length} записей. Импортируем...`, 'info');
        
        // Добавляем товары в Firestore
        const result = await importToFirestore(data);
        
        // Показываем результат
        if (result.errorCount > 0) {
          showMessage(`Импорт завершен! Успешно: ${result.importedCount}, Ошибок: ${result.errorCount}`, 'warning');
        } else {
          showSuccess(`Успешно импортировано ${result.importedCount} товаров!`);
        }
        
      } catch (error) {
        console.error('Ошибка импорта:', error);
        showError('Ошибка при импорте файла: ' + error.message);
      }
    }
  };
  input.click();
};

window.exportData = async function() {
  try {
    // Получаем данные из Firestore
    const items = await getScannedItems();
    
    if (!items || items.length === 0) {
      showError('Нет данных для экспорта');
      return;
    }
    
    // Экспортируем в Excel
    await exportToExcel(items);
    showSuccess('Данные экспортированы в Excel');
    
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    showError('Ошибка экспорта данных');
  }
};

window.clearAllData = async function() {
  if (confirm('Очистить все данные? Это действие нельзя отменить!')) {
    try {
      // Здесь будет логика очистки данных
      alert('Функция очистки данных в разработке');
    } catch (error) {
      showError('Ошибка очистки данных');
    }
  }
};

window.clearScan = clearScannerInput; // ← Используем функцию из модуля