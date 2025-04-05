// Add these functions to baseRenderer.js

/**
 * Show loading overlay
 * @param {String} message - Loading message to display
 */
export function showLoading(message = 'Loading...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;
    
    const loadingMessage = loadingOverlay.querySelector('.loading-message');
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    
    loadingOverlay.style.display = 'flex';
  }
  
  /**
   * Hide loading overlay
   */
  export function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
  
  /**
   * Show error message
   * @param {String} message - Error message to display
   * @param {Boolean} isFatal - Whether the error is fatal
   */
  export function showError(message, isFatal = false) {
    console.error("Game error:", message);
    
    try {
      const errorOverlay = document.getElementById('error-overlay');
      
      if (!errorOverlay) {
        alert(message); // Fallback if overlay not found
        return;
      }
      
      const errorMessage = errorOverlay.querySelector('.error-message');
      const errorCloseBtn = errorOverlay.querySelector('.error-close');
      
      if (errorMessage) {
        errorMessage.textContent = message;
      }
      
      if (errorCloseBtn) {
        errorCloseBtn.textContent = isFatal ? 'Restart Game' : 'Continue';
        errorCloseBtn.onclick = () => {
          hideError();
          if (isFatal) {
            window.location.reload();
          }
        };
      }
      
      errorOverlay.style.display = 'flex';
    } catch (e) {
      // Fallback to alert if showing the error overlay fails
      console.error("Error showing error overlay:", e);
      alert(message);
    }
  }
  
  /**
   * Hide error overlay
   */
  export function hideError() {
    const errorOverlay = document.getElementById('error-overlay');
    if (errorOverlay) {
      errorOverlay.style.display = 'none';
    }
}