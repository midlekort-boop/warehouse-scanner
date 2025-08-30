import { addScannedItem } from './firestore.js';
import { updateCurrentBarcode } from './ui-update.js';
import { showSuccess, showError } from './notifications.js';

export const setupScannerHandlers = () => {
  const scanInput = document.getElementById('scanInput');
  if (!scanInput) return;

  scanInput.addEventListener('keypress', handleScanInput);
  scanInput.focus();
};

export const handleScanInput = async (event) => {
  if (event.key === 'Enter') {
    const barcode = event.target.value.trim();
    if (barcode) {
      await processScannedBarcode(barcode);
      event.target.value = '';
    }
  }
};

export const processScannedBarcode = async (barcode) => {
  try {
    const quantityInput = document.getElementById('quantityInput');
    const quantity = parseInt(quantityInput?.value) || 1;
    
    await addScannedItem({
      barcode: barcode,
      quantity: quantity,
      timestamp: new Date()
    });
    
    updateCurrentBarcode(barcode);
    showSuccess(`Штрихкод ${barcode} добавлен!`);
    
  } catch (error) {
    console.error('Ошибка обработки штрихкода:', error);
    showError('Ошибка обработки штрихкода');
  }
};

export const clearScannerInput = () => {
  const scanInput = document.getElementById('scanInput');
  if (scanInput) {
    scanInput.value = '';
    scanInput.focus();
  }
};

export const simulateBarcodeScan = (barcode, quantity = 1) => {
  const quantityInput = document.getElementById('quantityInput');
  if (quantityInput) {
    quantityInput.value = quantity;
  }
  
  processScannedBarcode(barcode);
};