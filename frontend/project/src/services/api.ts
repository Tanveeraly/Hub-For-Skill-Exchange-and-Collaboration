import axios from 'axios';

// Ensure withCredentials is true by default for all requests
axios.defaults.withCredentials = true;

// Request interceptor to attach Bearer token to EVERY axios call
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch any refreshed tokens from backend
axios.interceptors.response.use(
  (response) => {
    const refreshedToken = response.headers?.['x-access-token'];
    if (refreshedToken) {
      localStorage.setItem('accessToken', refreshedToken);
    }
    return response;
  },
  (error) => {
    // If backend reports token expired or unauthorized
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || '';
      if (
        message.includes('please login') ||
        message.includes('Session expired') ||
        message.includes('Invalid token')
      ) {
        // Clear token if it's truly invalid
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
          console.warn('Session unauthorized:', message);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
