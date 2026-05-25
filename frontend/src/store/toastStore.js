import { create } from 'zustand';

export const useToastStore = create((set) => ({
  message: '',
  type: 'info', // 'success', 'error', 'info'
  visible: false,
  showToast: (message, type = 'info') => {
    set({ message, type, visible: true });
    
    // Auto hide after 3 seconds
    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout);
    }
    window.toastTimeout = setTimeout(() => {
      set({ visible: false });
    }, 3000);
  },
  hideToast: () => set({ visible: false }),
}));
