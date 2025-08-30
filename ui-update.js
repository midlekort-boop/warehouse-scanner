export const updateCurrentBarcode = (barcode) => {
  const currentBarcodeElement = document.getElementById('currentBarcode');
  if (currentBarcodeElement) {
    currentBarcodeElement.textContent = barcode;
  }
};

export const updateDashboard = () => {
  console.log('Обновление дашборда...');
};

export const updateDashboardStats = (items) => {
  if (!items || !Array.isArray(items)) {
    console.warn('Нет данных для обновления статистики');
    return;
  }
  
  const totalScanned = items.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  const uniqueItems = new Set(items.map(item => item?.barcode).filter(Boolean)).size;
  
  const totalElement = document.querySelector('.stat-card.primary .stat-value');
  const uniqueElement = document.querySelector('.stat-card.success .stat-value');
  const progressElement = document.querySelector('.stat-card.info .stat-value');
  const progressBar = document.querySelector('.progress-fill');
  
  if (totalElement) totalElement.textContent = totalScanned;
  if (uniqueElement) uniqueElement.textContent = uniqueItems;
  
  const progress = Math.min((uniqueItems / 10) * 100, 100);
  if (progressElement) progressElement.textContent = `${Math.round(progress)}%`;
  if (progressBar) progressBar.style.width = `${progress}%`;
};

export const resetUI = () => {
  updateCurrentBarcode('-');
  
  const elements = {
    '.stat-card.primary .stat-value': '0',
    '.stat-card.success .stat-value': '0', 
    '.stat-card.info .stat-value': '0%',
    '.progress-fill': 'width: 0%'
  };
  
  Object.entries(elements).forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element) {
      if (selector.includes('width')) {
        element.style.width = value;
      } else {
        element.textContent = value;
      }
    }
  });
};