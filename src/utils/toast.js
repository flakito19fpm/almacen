import { CheckCircle2, XCircle } from 'lucide-react';

let toastCallbacks = [];

export const showToast = (type = 'success', message = '', duration = 3000) => {
  const toastId = Date.now();
  const toast = {
    id: toastId,
    type,
    message,
    duration,
  };
  
  toastCallbacks.forEach(callback => callback(toast));
  
  if (duration > 0) {
    setTimeout(() => {
      toastCallbacks.forEach(callback => callback({ ...toast, visible: false }));
    }, duration);
  }
  
  return toastId;
};

export const subscribeToToast = (callback) => {
  toastCallbacks.push(callback);
  return () => {
    toastCallbacks = toastCallbacks.filter(cb => cb !== callback);
  };
};