export const renderTable = (items) => {
  const tbody = document.getElementById('dataBody');
  if (!tbody) return;
  
  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #718096;">
          Нет отсканированных товаров
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = items.map(item => `
    <tr>
      <td>${item?.barcode || 'Нет штрихкода'}</td>
      <td>${item?.quantity || 1}</td>
      <td>${item?.timestamp?.toDate?.()?.toLocaleString() || item?.timestamp || 'Нет данных'}</td>
      <td>
        <button class="delete-btn" onclick="deleteItem('${item?.id || ''}')">Удалить</button>
      </td>
    </tr>
  `).join('');
};

export const renderExpectedItems = (items) => {
  const expectedList = document.getElementById('expectedList');
  if (!expectedList) return;
  
  if (!items || items.length === 0) {
    expectedList.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #718096;">
        Нет ожидаемых товаров
      </div>
    `;
    return;
  }
  
  expectedList.innerHTML = items.map(item => {
    const expected = item?.expected || 0;
    const scanned = item?.scanned || 0;
    const remaining = expected - scanned;
    
    let statusClass = 'zero';
    if (remaining > 0 && remaining < 5) statusClass = 'warning';
    if (remaining >= 5) statusClass = 'danger';
    
    return `
    <div class="expected-item">
      <div class="expected-barcode">${item?.barcode || 'Нет штрихкода'}</div>
      <div class="expected-quantity">${expected}</div>
      <div class="expected-scanned">${scanned}</div>
      <div class="expected-remaining ${statusClass}">${remaining}</div>
    </div>
    `;
  }).join('');
};