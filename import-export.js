import { addExpectedItem } from './firestore.js';

export const readExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const importToFirestore = async (data) => {
  let importedCount = 0;
  let errorCount = 0;
  
  for (const item of data) {
    try {
      const itemData = {
        barcode: String(item.barcode || item.штрихкод || item['Штрихкод'] || ''),
        expected: parseInt(item.expected || item.ожидается || item['Ожидаемое количество'] || 0),
        scanned: parseInt(item.scanned || item.отсканировано || item['Отсканировано'] || 0)
      };
      
      if (!itemData.barcode) {
        errorCount++;
        continue;
      }
      
      await addExpectedItem(itemData);
      importedCount++;
      
    } catch (error) {
      console.error('Ошибка импорта товара:', item, error);
      errorCount++;
    }
  }
  
  return { importedCount, errorCount };
};

export const exportToExcel = async (items) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items.map(item => ({
    'Штрихкод': item.barcode,
    'Количество': item.quantity,
    'Время': item.timestamp?.toDate?.()?.toLocaleString() || 'Нет данных'
  })));
  
  XLSX.utils.book_append_sheet(wb, ws, 'Отсканированные товары');
  XLSX.writeFile(wb, `скан_товары_${new Date().toISOString().split('T')[0]}.xlsx`);
};