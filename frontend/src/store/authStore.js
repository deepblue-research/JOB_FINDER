import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: null,
  user: null,
  resumeUploaded: false,
  setToken: (token) => {
    localStorage.setItem('jm_token', token);
    set({ token });
  },
  setResumeUploaded: (val) => set({ resumeUploaded: val }),
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('jm_token');
    set({ token: null, user: null });
  },
  init: () => {
    const token = localStorage.getItem('jm_token');
    if (token) {
      set({ token });
    }
  }
}));

export default useAuthStore;