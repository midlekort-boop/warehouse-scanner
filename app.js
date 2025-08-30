let printedBarcodes = {
    pallets: [],
    boxes: []
};

// Загрузка из localStorage
function loadPrintedBarcodes() {
    const saved = localStorage.getItem('printedBarcodes');
    if (saved) {
        printedBarcodes = JSON.parse(saved);
    }
}

// Сохранение в localStorage
function savePrintedBarcodes() {
    localStorage.setItem('printedBarcodes', JSON.stringify(printedBarcodes));
}

// ==================== АВТОМАТИЧЕСКИЙ КОНТРОЛЬ ВЕРСИЙ ====================
const APP_VERSION = '6.1'; // Увеличиваем версию
const VERSION_KEY = 'app_version';

function checkVersion() {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    
    if (savedVersion !== APP_VERSION) {
        console.log('🔄 Обновление до новой версии...');
        
        // Очищаем кэш стилей и скриптов
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        const scripts = document.querySelectorAll('script[src]');
        
        links.forEach(link => {
            if (link.href.includes('.css')) {
                link.href = link.href.split('?')[0] + '?v=' + Date.now();
            }
        });
        
        scripts.forEach(script => {
            if (script.src.includes('.js')) {
                script.src = script.src.split('?')[0] + '?v=' + Date.now();
            }
        });
        
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        
        // Перезагрузка
        setTimeout(() => {
            window.location.reload(true);
        }, 500);
        
        return false;
    }
    
    console.log('✅ Версия актуальна');
    return true;
}

// Запускаем проверку
if (!checkVersion()) {
    throw new Error('Требуется обновление версии');
}

// ==================== БАЗОВЫЕ ФУНКЦИИ ====================
async function initNativeFeatures() {
    if (!navigator.onLine) {
        showError('⚠️ Работа в оффлайн-режиме');
        document.getElementById('offlineIndicator').style.display = 'block';
    }
}

// ==================== FIREBASE КОНФИГУРАЦИЯ ====================
const firebaseConfig = {
  apiKey: "AIzaSyAbLcTFolqzRdLoKn1H_o8g0WhHiZPd3QI",
  authDomain: "warehouse-scanner-ai123.firebaseapp.com",
  projectId: "warehouse-scanner-ai123",
  storageBucket: "warehouse-scanner-ai123.firebasestorage.app",
  messagingSenderId: "188867148301",
  appId: "1:188867148301:web:38511b45f319c3ad213344"
};

let app;
let db;
let auth;

function initializeFirebase() {
    try {
        console.log("Инициализация Firebase...");
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        console.log("✅ Firebase инициализирован");
        return { app, auth, db };
    } catch (error) {
        console.error("❌ Ошибка Firebase:", error);
        showError("Ошибка Firebase: " + error.message);
        return null;
    }
}

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentPallet = null;
let currentBox = null;
let scanData = [];
let expectedItems = {};
let remainingItems = {};
let history = [];
let currentSort = { column: 'timestamp', direction: 'desc' };
let currentView = 'all';
let lastPalletNumber = 0;
let lastBoxNumber = 0;
let currentPage = 1;
const itemsPerPage = 50;
let currentDeviceId = null;

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Приложение запущено');
    
    // Инициализируем Firebase
    initializeFirebase();
    
    // Настраиваем обработчики для кнопок
    const loginBtn = document.querySelector('.auth-form button:first-of-type');
    const registerBtn = document.querySelector('.auth-form button:last-of-type');
    
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    
    // Обработка Enter в форме авторизации
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    if (emailInput && passwordInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                passwordInput.focus();
            }
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    // Проверяем авторизацию
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("✅ Пользователь авторизован:", user.email);
                showAppInterface();
                initApp();
            }
        });
    }
    
    // Устанавливаем ID устройства
    currentDeviceId = getDeviceId();
    const deviceIdElement = document.getElementById('deviceId');
    if (deviceIdElement) {
        deviceIdElement.textContent = currentDeviceId;
    }
    
    // Инициализируем базовые функции
    initNativeFeatures();
});

// ==================== АУТЕНТИФИКАЦИЯ ====================
async function handleLogin() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    
    if (!email || !password) {
        showError('Заполните все поля');
        return;
    }
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Вход выполнен");
        showAppInterface();
        initApp();
    } catch (error) {
        showError('Ошибка входа: ' + error.message);
    }
}

async function handleRegister() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    
    if (!email || !password) {
        showError('Заполните все поля');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log("✅ Регистрация выполнена");
        showAppInterface();
        initApp();
    } catch (error) {
        showError('Ошибка регистрации: ' + error.message);
    }
}

async function logout() {
    try {
        // Очищаем текущие данные сессии (но сохраняем основные данные)
        currentPallet = null;
        currentBox = null;
        
        await auth.signOut();
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('authContainer').style.display = 'block';
        
        // Очищаем поля ввода
        document.getElementById('emailInput').value = '';
        document.getElementById('passwordInput').value = '';
        
        console.log("✅ Выход выполнен");
    } catch (error) {
        console.error("Ошибка выхода:", error);
        showError("Ошибка при выходе: " + error.message);
    }
}

function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
function showAppInterface() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    if (auth && auth.currentUser) {
        document.getElementById('userEmail').textContent = auth.currentUser.email;
    }
}

function initApp() {
    loadFromStorage();
    loadExpectedItems();
    loadHistory();
    loadLastNumbers();
    loadPrintedBarcodes(); // Загружаем созданные штрихкоды
    
    updateCurrentInfo();
    updateDashboard();
    renderTable();
    updateExistingLists();
    renderHistory();
    renderExpectedItems();
    
    setupEventListeners();
    setupKeyboardShortcuts();
    
    // Фокус на поле ввода после загрузки
    setTimeout(() => {
        const scanInput = document.getElementById('scanInput');
        if (scanInput) scanInput.focus();
    }, 100);
}

function clearPrintedBarcodes() {
    if (confirm('Очистить все созданные штрихкоды?')) {
        printedBarcodes = { pallets: [], boxes: [] };
        savePrintedBarcodes();
        updateExistingLists();
        addToHistory('Очищены созданные штрихкоды');
        alert('Созданные штрихкоды очищены');
    }
}

// Добавьте эту функцию
function updateDeviceIdHeader() {
    const deviceIdHeader = document.getElementById('deviceIdHeader');
    if (deviceIdHeader) {
        deviceIdHeader.textContent = currentDeviceId;
    }
}

// В функции getDeviceId() добавьте:
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }
    
    // Обновляем заголовок сразу после получения ID
    setTimeout(() => {
        updateDeviceIdHeader();
    }, 100);
    
    return deviceId;
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem('warehouseScannerData');
        if (saved) {
            const data = JSON.parse(saved);
            scanData = data.scanData || [];
        }
    } catch (e) {
        console.error('Ошибка загрузки данных:', e);
    }
}

function saveToStorage() {
    const dataToSave = {
        scanData: scanData,
    };
    localStorage.setItem('warehouseScannerData', JSON.stringify(dataToSave));
}

function loadExpectedItems() {
    try {
        const saved = localStorage.getItem('expectedItems');
        expectedItems = saved ? JSON.parse(saved) : {};
        calculateRemainingItems();
    } catch (error) {
        expectedItems = {};
    }
}

function saveExpectedItems() {
    localStorage.setItem('expectedItems', JSON.stringify(expectedItems));
}

function loadHistory() {
    try {
        const saved = localStorage.getItem('scanHistory');
        history = saved ? JSON.parse(saved) : [];
    } catch (error) {
        history = [];
    }
}

function saveHistory() {
    localStorage.setItem('scanHistory', JSON.stringify(history));
}

function loadLastNumbers() {
    lastPalletNumber = parseInt(localStorage.getItem('lastPalletNumber') || '0');
    lastBoxNumber = parseInt(localStorage.getItem('lastBoxNumber') || '0');
}

function saveLastNumbers() {
    localStorage.setItem('lastPalletNumber', lastPalletNumber);
    localStorage.setItem('lastBoxNumber', lastBoxNumber);
}

function calculateRemainingItems() {
    remainingItems = {...expectedItems};
    scanData.forEach(item => {
        if (remainingItems[item.barcode] !== undefined) {
            remainingItems[item.barcode] -= item.quantity;
            if (remainingItems[item.barcode] < 0) {
                remainingItems[item.barcode] = 0;
            }
        }
    });
}

function updateRemainingItems(barcode, quantityChange = 0) {
    if (expectedItems[barcode] !== undefined) {
        if (!remainingItems[barcode]) {
            remainingItems[barcode] = expectedItems[barcode];
        }
        remainingItems[barcode] = Math.max(0, remainingItems[barcode] - quantityChange);
    }
}

function addToHistory(action) {
    const historyItem = {
        timestamp: new Date().toLocaleString('ru-RU'),
        action: action,
        device: currentDeviceId
    };
    
    history.unshift(historyItem);
    if (history.length > 1000) history.pop();
    saveHistory();
    renderHistory();
}

function showError(message) {
    console.error("Ошибка:", message);
    
    const errorContainer = document.getElementById('errorContainer');
    if (!errorContainer) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">
                ✕
            </button>
        </div>
    `;
    
    errorContainer.appendChild(errorDiv);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.classList.add('hiding');
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 300);
        }
    }, 5000);
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    const recentHistory = history.slice(0, 5);
    
    if (recentHistory.length === 0) {
        historyList.innerHTML = '<div class="history-item">История изменений отсутствует</div>';
        return;
    }
    
    recentHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `<div><strong>${item.timestamp}</strong></div><div>${item.action} (${item.device})</div>`;
        historyList.appendChild(historyItem);
    });
}

function setupEventListeners() {
    const scanInput = document.getElementById('scanInput');
    if (!scanInput) return;
    
    let scanBuffer = '';
    let scanTimeout = null;

    scanInput.addEventListener('input', (e) => {
        const newValue = e.target.value;
        e.target.value = '';
        scanBuffer += newValue;
        
        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
            if (scanBuffer.length > 0) {
                processScannedData(scanBuffer);
                scanBuffer = '';
            }
        }, 50);
    });

    scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && scanBuffer) {
            e.preventDefault();
            processScannedData(scanBuffer);
            scanBuffer = '';
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+F - фокус на поиск
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('tableFilter');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl+E - экспорт
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportToExcel();
        }
        
        // Ctrl+P - печать
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                printNextBarcode('box');
            }
        }
        
        // Esc - очистка поля ввода
        if (e.key === 'Eescape') {
            const scanInput = document.getElementById('scanInput');
            if (document.activeElement === scanInput && scanInput.value) {
                scanInput.value = '';
            } else if (scanInput) {
                scanInput.focus();
            }
        }
    });
}

function processScannedData(data) {
    console.log('Сканирование:', data);
    
    const palletPrefix = document.getElementById('palletPrefix')?.value || 'PALLET:';
    const boxPrefix = document.getElementById('boxPrefix')?.value || 'BOX:';

    if (data.startsWith(palletPrefix)) {
        currentPallet = data.substring(palletPrefix.length);
        currentBox = null;
        addToHistory(`Установлена паллета: ${currentPallet}`);
        updateCurrentInfo();
    } 
    else if (data.startsWith(boxPrefix)) {
        currentBox = data.substring(boxPrefix.length);
        addToHistory(`Установлен короб: ${currentBox}`);
        updateCurrentInfo();
    } 
    else {
        // Проверяем, есть ли товар в ожидаемых
        if (Object.keys(expectedItems).length > 0 && !expectedItems[data]) {
            showError(`Товар "${data}" не может быть размещён, т.к. он не является позицией в текущей заявке!`);
            addToHistory(`Ошибка: товар ${data} не найден в заявке`);
            return;
        }
        
        // Проверяем лимит товара
        const validationResult = validateItemQuantity(data);
        if (!validationResult.isValid) {
            showError(validationResult.message);
            addToHistory(`Ошибка: ${validationResult.message}`);
            return;
        }
        
        addItem(data);
    }
    
    const input = document.getElementById('scanInput');
    if (input) input.value = '';
}

function addItem(barcode) {
    // Проверяем, есть ли уже такой товар в том же коробе и паллете
    const existingItemIndex = scanData.findIndex(item => 
        item.barcode === barcode && 
        item.box === currentBox && 
        item.pallet === currentPallet
    );

    if (existingItemIndex !== -1) {
        // Увеличиваем количество существующего товара
        scanData[existingItemIndex].quantity += 1;
        scanData[existingItemIndex].timestamp = new Date().toLocaleString('ru-RU');
        scanData[existingItemIndex].device = currentDeviceId;
        addToHistory(`Увеличено количество для: ${barcode}`);
    } else {
        // Добавляем новый товар
        const newItem = {
            pallet: currentPallet,
            box: currentBox,
            barcode: barcode,
            quantity: 1,
            timestamp: new Date().toLocaleString('ru-RU'),
            device: currentDeviceId
        };
        scanData.push(newItem);
        addToHistory(`Добавлен штрихкод: ${barcode}`);
    }

    updateRemainingItems(barcode, 1);
    saveToStorage();
    renderTable();
    updateDashboard();
    renderExpectedItems();
    
    // Подсвечиваем отсканированный товар и поднимаем наверх
    highlightScannedItem(barcode);
}

function validateItemQuantity(barcode) {
    if (expectedItems[barcode] === undefined) {
        return { isValid: true, message: '' };
    }

    const expectedQty = expectedItems[barcode];
    const alreadyScanned = scanData
        .filter(item => item.barcode === barcode)
        .reduce((sum, item) => sum + item.quantity, 0);

    const willBeAfterAdd = alreadyScanned + 1;

    if (willBeAfterAdd > expectedQty) {
        return {
            isValid: false,
            message: `Невозможно разместить больше! Штрихкод: ${barcode}\nОжидалось: ${expectedQty}\nПопытка добавить: ${willBeAfterAdd}`
        };
    }

    return { isValid: true, message: '' };
}

function highlightScannedItem(barcode) {
    // Подсвечиваем в левой панели и поднимаем под заголовок
    const expectedList = document.getElementById('expectedList');
    const expectedItems = expectedList.querySelectorAll('.expected-item');
    
    expectedItems.forEach(item => {
        const barcodeElement = item.querySelector('.expected-barcode');
        if (barcodeElement && barcodeElement.textContent === barcode) {
            item.classList.add('scanned');
            
            // Перемещаем ПОД заголовок (не на самое верx)
            const header = expectedList.querySelector('.expected-header');
            if (header && header.nextSibling) {
                expectedList.insertBefore(item, header.nextSibling);
            } else {
                expectedList.appendChild(item);
            }
            
            setTimeout(() => {
                item.classList.remove('scanned');
            }, 2000);
        }
    });
    
    // Подсвечиваем в таблице (оставляем без изменений)
    const tableRows = document.querySelectorAll('#dataBody tr');
    tableRows.forEach(row => {
        const barcodeCell = row.querySelector('td:nth-child(3)');
        if (barcodeCell && barcodeCell.textContent === barcode) {
            row.classList.add('scanned-highlight');
            setTimeout(() => {
                row.classList.remove('scanned-highlight');
            }, 2000);
        }
    });
}

function updateCurrentInfo() {
    const currentPalletElement = document.getElementById('currentPallet');
    const currentBoxElement = document.getElementById('currentBox');
    
    if (currentPalletElement) currentPalletElement.textContent = currentPallet || '-';
    if (currentBoxElement) currentBoxElement.textContent = currentBox || '-';
}

function updateDashboard() {
    const dashboard = document.getElementById('compactDashboard');
    if (!dashboard) return;
    
    const totalExpected = Object.values(expectedItems).reduce((sum, qty) => sum + qty, 0);
    const totalScanned = scanData.reduce((sum, item) => sum + item.quantity, 0);
    const completionPercentage = totalExpected > 0 ? Math.round((totalScanned / totalExpected) * 100) : 0;
    
    const uniquePallets = new Set(scanData.map(item => item.pallet).filter(p => p));
    const uniqueBoxes = new Set(scanData.map(item => item.box).filter(b => b));
    const uniqueProducts = new Set(scanData.map(item => item.barcode));
    
    dashboard.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card primary">
                <div class="stat-value">${totalScanned}</div>
                <div class="stat-label">Всего отсканировано</div>
                <div class="stat-subtext">из ${totalExpected} ожидаемых</div>
            </div>
            
            <div class="stat-card success">
                <div class="stat-value">${completionPercentage}%</div>
                <div class="stat-label">Выполнение плана</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${completionPercentage}%"></div>
                </div>
            </div>
            
            <div class="stat-card info">
                <div class="stat-value">${uniquePallets.size}</div>
                <div class="stat-label">Паллет</div>
                <div class="stat-subtext">использовано</div>
            </div>
            
            <div class="stat-card warning">
                <div class="stat-value">${uniqueBoxes.size}</div>
                <div class="stat-label">Коробов</div>
                <div class="stat-subtext">обработано</div>
            </div>
            
            <div class="stat-card secondary">
                <div class="stat-value">${uniqueProducts.size}</div>
                <div class="stat-label">Товаров</div>
                <div class="stat-subtext">разных SKU</div>
            </div>
        </div>
    `;
}

function renderExpectedItems() {
    const expectedList = document.getElementById('expectedList');
    if (!expectedList) return;
    
    // Очищаем только items, оставляем header
    const items = expectedList.querySelectorAll('.expected-item');
    items.forEach(item => item.remove());
    
    // Сортируем по убыванию ожидаемого количества
    const sortedItems = Object.entries(expectedItems)
        .sort(([,a], [,b]) => b - a);
    
    sortedItems.forEach(([barcode, expectedQty]) => {
        const scannedQty = scanData
            .filter(item => item.barcode === barcode)
            .reduce((sum, item) => sum + item.quantity, 0);
        
        const remainingQty = Math.max(0, expectedQty - scannedQty);
        
        const itemElement = document.createElement('div');
        itemElement.className = 'expected-item';
        itemElement.innerHTML = `
            <div class="expected-barcode">${barcode}</div>
            <div class="expected-quantity">${expectedQty}</div>
            <div class="expected-scanned">${scannedQty}</div>
            <div class="expected-remaining ${remainingQty === 0 ? 'zero' : remainingQty < expectedQty * 0.3 ? 'danger' : 'warning'}">${remainingQty}</div>
        `;
        
        expectedList.appendChild(itemElement);
    });
}

function filterExpectedItems(searchTerm) {
    const items = document.querySelectorAll('.expected-item');
    items.forEach(item => {
        const barcodeElement = item.querySelector('.expected-barcode');
        if (barcodeElement && barcodeElement.textContent.includes(searchTerm)) {
            item.style.display = 'grid';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearExpectedFilter() {
    document.getElementById('expectedSearch').value = '';
    const items = document.querySelectorAll('.expected-item');
    items.forEach(item => {
        item.style.display = 'grid';
    });
}

function clearTableFilter() {
    document.getElementById('tableFilter').value = '';
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('dataBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const filterText = document.getElementById('tableFilter')?.value.toLowerCase() || '';
    
    let filteredData = scanData.filter(item => 
        !filterText || 
        (item.pallet && item.pallet.toLowerCase().includes(filterText)) ||
        (item.box && item.box.toLowerCase().includes(filterText)) ||
        (item.barcode && item.barcode.toLowerCase().includes(filterText))
    );
    
    // Сортируем от новых к старым
    filteredData = sortData(filteredData);
    
    // Пагинация
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
    
    if (currentView === 'grouped') {
        renderGroupedTable(paginatedData);
    } else {
        renderAllTable(paginatedData);
    }
    
    // Добавляем пагинацию
    renderPagination(filteredData.length, totalPages);
}

function renderPagination(totalItems, totalPages) {
    let paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.className = 'pagination';
        document.querySelector('.data-table-container').appendChild(paginationContainer);
    }
    
    paginationContainer.innerHTML = `
        <div class="pagination-info">
            Показано ${Math.min(itemsPerPage, totalItems)} из ${totalItems} записей
        </div>
        <div class="pagination-controls">
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Назад</button>
            <span>Страница ${currentPage} из ${totalPages}</span>
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Вперед →</button>
        </div>
    `;
}

function changePage(page) {
    const totalPages = Math.ceil(scanData.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTable();
    }
}

function sortData(data) {
    return data.sort((a, b) => {
        let valueA = a[currentSort.column];
        let valueB = b[currentSort.column];
        
        if (currentSort.column === 'quantity') {
            valueA = Number(valueA); 
            valueB = Number(valueB);
        } else if (currentSort.column === 'timestamp') {
            valueA = new Date(valueA); 
            valueB = new Date(valueB);
        }
        
        if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function renderAllTable(data) {
    const tbody = document.getElementById('dataBody');
    
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.pallet || '-'}</td>
            <td>${item.box || '-'}</td>
            <td>${item.barcode}</td>
            <td>${item.quantity}</td>
            <td>${item.timestamp}</td>
            <td>${item.device || '-'}</td>
            <td><button class="delete-btn" onclick="deleteItem(${scanData.length - index - 1})">Удалить</button></td>
        `;
        tbody.appendChild(row);
    });
}

function renderGroupedTable(data) {
    const tbody = document.getElementById('dataBody');
    const groupedData = {};
    
    data.forEach(item => {
        const groupKey = `${item.pallet || 'no-pallet'}_${item.box || 'no-box'}`;
        if (!groupedData[groupKey]) {
            groupedData[groupKey] = { pallet: item.pallet, box: item.box, items: [], total: 0 };
        }
        
        const existingItemIndex = groupedData[groupKey].items.findIndex(i => i.barcode === item.barcode);
        if (existingItemIndex !== -1) {
            groupedData[groupKey].items[existingItemIndex].quantity += item.quantity;
        } else {
            groupedData[groupKey].items.push({...item});
        }
        groupedData[groupKey].total += item.quantity;
    });
    
    Object.values(groupedData).sort((a, b) => {
        if (a.pallet !== b.pallet) return (a.pallet || '').localeCompare(b.pallet || '');
        return (a.box || '').localeCompare(b.box || '');
    }).forEach(group => {
        const groupHeader = document.createElement('tr');
        groupHeader.className = 'group-header';
        groupHeader.innerHTML = `<td colspan="7">📦 ${group.pallet || 'Без паллеты'} / ${group.box || 'Без короба'} (Всего: ${group.total} шт.)</td>`;
        tbody.appendChild(groupHeader);
        
        group.items.forEach(item => {
            const originalIndex = scanData.findIndex(scan => scan.pallet === item.pallet && scan.box === item.box && scan.barcode === item.barcode);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.pallet || '-'}</td>
                <td>${item.box || '-'}</td>
                <td>${item.barcode}</td>
                <td>${item.quantity}</td>
                <td>${item.timestamp}</td>
                <td>${item.device || '-'}</td>
                <td><button class="delete-btn" onclick="deleteItem(${originalIndex})">Удалить</button></td>
            `;
            tbody.appendChild(row);
        });
    });
}

function deleteItem(index) {
    if (index < 0 || index >= scanData.length) return;
    
    const deletedItem = scanData[index];
    scanData.splice(index, 1);
    updateRemainingItems(deletedItem.barcode, -deletedItem.quantity);
    addToHistory(`Удален штрихкод: ${deletedItem.barcode}`);
    saveToStorage();
    renderTable();
    updateDashboard();
    renderExpectedItems();
}

function toggleTableView(view) {
    currentView = view;
    currentPage = 1;
    renderTable();
    
    const viewAllButton = document.getElementById('viewAll');
    const viewGroupedButton = document.getElementById('viewGrouped');
    
    if (viewAllButton && viewGroupedButton) {
        viewAllButton.classList.toggle('active', view === 'all');
        viewGroupedButton.classList.toggle('active', view === 'grouped');
    }
}

function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    currentPage = 1;
    renderTable();
}

function clearScan() {
    const input = document.getElementById('scanInput');
    if (input) {
        input.value = '';
        input.focus();
    }
}

function printNextBarcode(type) {
    const prefix = type === 'pallet' ? document.getElementById('palletPrefix').value : document.getElementById('boxPrefix').value;
    const autoIncrement = document.getElementById('autoIncrement').checked;
    let number;
    
    if (autoIncrement) {
        if (type === 'pallet') {
            lastPalletNumber++;
            number = lastPalletNumber.toString().padStart(4, '0');
        } else {
            lastBoxNumber++;
            number = lastBoxNumber.toString().padStart(6, '0');
        }
        saveLastNumbers();
    } else {
        number = prompt(`Введите номер для ${type === 'pallet' ? 'паллеты' : 'короба'}:`);
        if (!number) return;
    }
    
    const barcodeValue = prefix + number;
    
    // Сохраняем созданный штрихкод
    if (type === 'pallet') {
        if (!printedBarcodes.pallets.includes(barcodeValue)) {
            printedBarcodes.pallets.push(barcodeValue);
        }
    } else {
        if (!printedBarcodes.boxes.includes(barcodeValue)) {
            printedBarcodes.boxes.push(barcodeValue);
        }
    }
    savePrintedBarcodes();
    
    addToHistory(`Напечатан штрихкод: ${barcodeValue}`);
    printBarcodeDirect(barcodeValue, type);
    
    // Обновляем списки для печати
    updateExistingLists();
}

function printExisting(type) {
    const selectElement = document.getElementById(type === 'pallet' ? 'existingPallets' : 'existingBoxes');
    const value = selectElement.value;
    if (!value) {
        showError('Выберите значение из списка');
        return;
    }
    
    addToHistory(`Повторно напечатан штрихкод: ${value}`);
    printBarcodeDirect(value, type);
}

function printBarcodeDirect(value, type) {
    if (typeof JsBarcode === 'undefined') {
        showError('Библиотека штрихкодов не загружена');
        return;
    }

    const barcodeType = document.getElementById('barcodeType').value;
    const showText = document.getElementById('showText').checked;
    
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    try {
        JsBarcode(canvas, value, {
            format: barcodeType,
            displayValue: showText,
            width: 2,
            height: 40,
            fontSize: 12,
            margin: 5,
            textMargin: 2
        });
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head><title>Печать штрихкода</title>
                <style>
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 0; 
                            width: 58mm; 
                            height: 40mm; 
                            font-family: Arial, sans-serif; 
                        }
                        @page { 
                            size: 58mm 40mm; 
                            margin: 0; 
                        }
                        .label-container { 
                            width: 58mm; 
                            height: 40mm; 
                            display: flex; 
                            flex-direction: column; 
                            justify-content: center; 
                            align-items: center; 
                            padding: 2mm; 
                            box-sizing: border-box; 
                        }
                        .label-type { 
                            font-size: 12px; 
                            font-weight: bold; 
                            margin-bottom: 2mm; 
                            text-align: center; 
                        }
                        .barcode-container { 
                            margin: 1mm 0; 
                            max-width: 54mm; 
                            max-height: 20mm; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                        }
                        .barcode-value { 
                            font-size: 10px; 
                            text-align: center; 
                            margin-top: 1mm; 
                            word-break: break-all; 
                            max-width: 54mm; 
                            padding: 0 1mm; 
                        }
                        .print-date { 
                            font-size: 9px; 
                            margin-top: 1mm; 
                            color: #666; 
                        }
                    }
                </style>
            </head>
            <body>
                <div class="label-container">
                    <div class="label-type">${type === 'pallet' ? 'ПАЛЛЕТА' : 'КОРОБ'}</div>
                    <div class="barcode-container">
                        <img src="${canvas.toDataURL('image/png')}" style="max-width: 54mm; max-height: 20mm;">
                    </div>
                    ${showText ? `<div class="barcode-value">${value}</div>` : ''}
                    <div class="print-date">${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}</div>
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            setTimeout(() => {
                printWindow.close();
                document.body.removeChild(container);
            }, 100);
        }, 500);
        
    } catch (error) {
        showError('Ошибка при генерации штрихкода: ' + error.message);
        document.body.removeChild(container);
    }
}

function exportToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        const excelData = [
            ['Отчет сканирования склада'],
            ['Дата формирования:', new Date().toLocaleString('ru-RU')],
            ['Всего записей:', scanData.length],
            [''],
            ['Паллета', 'Короб', 'Штрихкод товара', 'Количество', 'Время', 'Устройство']
        ];
        
        scanData.forEach(item => {
            excelData.push([
                item.pallet || '',
                item.box || '',
                item.barcode,
                item.quantity,
                item.timestamp,
                item.device || ''
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, 'Сканы склада');
        XLSX.writeFile(wb, `сканер_склада_${new Date().toISOString().split('T')[0]}.xlsx`);
        
    } catch (error) {
        showError('Ошибка при создании Excel файла');
    }
}

function exportFullHistoryToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        // Экспорт основной истории
        const historyData = [
            ['Полная история изменений'],
            ['Дата формирования:', new Date().toLocaleString('ru-RU')],
            ['Всего записей:', history.length],
            [''],
            ['Время', 'Действие', 'Устройство']
        ];
        
        history.forEach(item => {
            historyData.push([item.timestamp, item.action, item.device]);
        });
        
        const wsHistory = XLSX.utils.aoa_to_sheet(historyData);
        XLSX.utils.book_append_sheet(wb, wsHistory, 'История изменений');
        
        // Экспорт всех сканов
        const scanDataExport = [
            ['Все сканирования'],
            ['Дата формирования:', new Date().toLocaleString('ru-RU')],
            ['Всего записей:', scanData.length],
            [''],
            ['Паллета', 'Короб', 'Штрихкод товара', 'Количество', 'Время', 'Устройство']
        ];
        
        scanData.forEach(item => {
            scanDataExport.push([
                item.pallet || '',
                item.box || '',
                item.barcode,
                item.quantity,
                item.timestamp,
                item.device || ''
            ]);
        });
        
        const wsScans = XLSX.utils.aoa_to_sheet(scanDataExport);
        XLSX.utils.book_append_sheet(wb, wsScans, 'Все сканы');
        
        XLSX.writeFile(wb, `полная_история_${new Date().toISOString().split('T')[0]}.xlsx`);
        addToHistory('Экспортирована полная история');
        
    } catch (error) {
        showError('Ошибка при создании файла истории: ' + error.message);
    }
}

function clearAllData() {
    if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        scanData = [];
        printedBarcodes = { pallets: [], boxes: [] }; // Очищаем созданные штрихкоды
        saveToStorage();
        savePrintedBarcodes(); // Сохраняем изменения
        renderTable();
        updateDashboard();
        renderExpectedItems();
        updateExistingLists(); // Обновляем списки
        addToHistory('Все данные очищены');
        alert('Все данные успешно очищены');
    }
}

function clearCurrent() {
    currentPallet = null;
    currentBox = null;
    updateCurrentInfo();
    addToHistory('Текущие паллета и короб сброшены');
    alert('Текущие паллета и короб сброшены');
}

function clearExpectedItems() {
    if (confirm('Очистить все ожидаемые товары?')) {
        expectedItems = {};
        remainingItems = {};
        saveExpectedItems();
        renderExpectedItems();
        addToHistory('Очищены ожидаемые товары');
        alert('Ожидаемые товары очищены');
    }
}

function loadExpectedFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            expectedItems = {};
            jsonData.forEach(row => {
                const barcode = row['Штрихкод'] || row['штрихкод'] || row['Barcode'] || row['barcode'];
                const quantity = row['Количество'] || row['количество'] || row['Quantity'] || row['quantity'];
                
                if (barcode && quantity) {
                    expectedItems[barcode] = parseInt(quantity);
                }
            });
            
            calculateRemainingItems();
            saveExpectedItems();
            updateDashboard();
            renderExpectedItems();
            addToHistory('Загружен новый план товаров');
            alert('Ожидаемые товары успешно загружены!');
            
        } catch (error) {
            showError('Ошибка при загрузке файла. Проверьте формат.');
        }
    };
    reader.readAsArrayBuffer(file);
}

function updateExistingLists() {
    const palletSelect = document.getElementById('existingPallets');
    const boxSelect = document.getElementById('existingBoxes');
    
    if (!palletSelect || !boxSelect) return;
    
    // Очищаем списки
    palletSelect.innerHTML = '<option value="">Выберите паллету</option>';
    boxSelect.innerHTML = '<option value="">Выберите короб</option>';
    
    // Добавляем только созданные паллеты
    printedBarcodes.pallets.forEach(pallet => {
        const option = document.createElement('option');
        option.value = pallet;
        option.textContent = pallet;
        palletSelect.appendChild(option);
    });
    
    // Добавляем только созданные короба
    printedBarcodes.boxes.forEach(box => {
        const option = document.createElement('option');
        option.value = box;
        option.textContent = box;
        boxSelect.appendChild(option);
    });
}

// ==================== ГЛОБАЛЬНЫЙ ЭКСПОРТ ====================
window.login = handleLogin;
window.register = handleRegister;
window.logout = logout;
window.clearScan = clearScan;
window.processScannedData = processScannedData;
window.addItem = addItem;
window.deleteItem = deleteItem;
window.toggleTableView = toggleTableView;
window.sortTable = sortTable;
window.printNextBarcode = printNextBarcode;
window.printExisting = printExisting;
window.printBarcodeDirect = printBarcodeDirect;
window.exportToExcel = exportToExcel;
window.exportFullHistoryToExcel = exportFullHistoryToExcel;
window.clearAllData = clearAllData;
window.clearCurrent = clearCurrent;
window.clearExpectedItems = clearExpectedItems;
window.loadExpectedFromFile = loadExpectedFromFile;
window.filterExpectedItems = filterExpectedItems;
window.clearExpectedFilter = clearExpectedFilter;
window.clearTableFilter = clearTableFilter;
window.changePage = changePage;