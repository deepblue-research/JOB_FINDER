import React from 'react';
import { useToastStore } from '../store/toastStore';

const Toast = () => {
  const { message, type, visible, hideToast } = useToastStore();

  if (!visible) return null;

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 ${bgColors[type] || bgColors.info} z-50 flex items-center gap-4`}>
      <span className="font-medium text-sm">{message}</span>
      <button 
        onClick={hideToast} 
        className="text-white/80 hover:text-white font-bold text-lg leading-none"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;
