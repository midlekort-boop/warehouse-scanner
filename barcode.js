import { showError, showSuccess } from './notifications.js';

export const printBarcode = (barcode, quantity = 1) => {
  if (!barcode || barcode === '-') {
    showError('Нет штрихкода для печати');
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Печать штрихкода - ${barcode}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center;
            padding: 20px;
          }
          .barcode-container { 
            margin: 20px auto; 
            max-width: 300px;
          }
          .quantity { 
            font-size: 18px; 
            margin-top: 10px;
            font-weight: bold;
          }
          .timestamp {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h2>📦 Сканер склада</h2>
        <div class="barcode-container">
          <svg id="barcode"></svg>
          ${quantity > 1 ? `<div class="quantity">Количество: ${quantity}</div>` : ''}
          <div class="timestamp">${new Date().toLocaleString()}</div>
        </div>
        <div class="no-print" style="margin-top: 20px;">
          <button onclick="window.print()">Печать</button>
          <button onclick="window.close()">Закрыть</button>
        </div>
        <script>
          JsBarcode('#barcode', '${barcode}', {
            format: "CODE128",
            displayValue: true,
            fontSize: 16,
            height: 50,
            margin: 10
          });
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
  
  showSuccess('Штрихкод подготовлен для печати');
};

export const generateBarcodeSvg = (barcode, options = {}) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, barcode, {
    format: "CODE128",
    displayValue: true,
    fontSize: 16,
    height: 50,
    margin: 10,
    ...options
  });
  return svg;
};