import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

client.interceptors.response.use((response) => response, (error) => {
  const url = error.config?.url || '';
  const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
  if (error.response?.status === 401 && !isAuthEndpoint) {
    localStorage.removeItem('jm_token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default client;