import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Immediately initialize Authorization header if token exists in localStorage
const existingToken = localStorage.getItem('token');
if (existingToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

// Request interceptor to ensure latest JWT token is always attached
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only clear and redirect if we actually had a token that was rejected
      const hadToken = !!localStorage.getItem('token');
      if (hadToken && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
