export const showSuccess = (message) => {
  showMessage(message, 'success');
};

export const showError = (message) => {
  showMessage(message, 'error');
};

export const showMessage = (message, type = 'error') => {
  const errorContainer = document.getElementById('errorContainer') || createErrorContainer();
  
  const messageElement = document.createElement('div');
  messageElement.className = `error-message ${type === 'success' ? 'success-message' : ''}`;
  messageElement.innerHTML = `
    <div>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  errorContainer.appendChild(messageElement);
  
  setTimeout(() => {
    if (messageElement.parentElement) {
      messageElement.classList.add('hiding');
      setTimeout(() => messageElement.remove(), 300);
    }
  }, 5000);
};

const createErrorContainer = () => {
  const container = document.createElement('div');
  container.id = 'errorContainer';
  container.className = 'error-container';
  document.body.appendChild(container);
  return container;
};