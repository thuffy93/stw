// ui/animation/Animator.js
export class Animator {
    static animate(element, animationType, duration = 500) {
      return new Promise(resolve => {
        element.classList.add(animationType);
        
        setTimeout(() => {
          element.classList.remove(animationType);
          resolve();
        }, duration);
      });
    }
    
    static fadeIn(element, duration = 300) {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      return new Promise(resolve => {
        setTimeout(() => {
          element.style.transition = `opacity ${duration}ms ease`;
          element.style.opacity = '1';
          
          setTimeout(resolve, duration);
        }, 10);
      });
    }
    
    static fadeOut(element, duration = 300) {
      element.style.opacity = '1';
      
      return new Promise(resolve => {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        
        setTimeout(() => {
          element.style.display = 'none';
          resolve();
        }, duration);
      });
    }
  }