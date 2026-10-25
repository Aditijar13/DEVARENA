import axios from 'axios';

// In production (Render), frontend is served by the same Express server,
// so API calls are relative (same origin). In development, use the proxy.
const BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : (process.env.REACT_APP_API_URL || '/api');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devarena_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 – try refresh token, otherwise redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';

    // Never intercept auth endpoints (login, register, refresh)
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      const refreshToken = localStorage.getItem('devarena_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('devarena_token', data.token);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        } catch {
          localStorage.removeItem('devarena_token');
          localStorage.removeItem('devarena_refresh');
          const currentPath = window.location.pathname;
          if (!['/login', '/register', '/', '/explore'].some(p => currentPath === p || currentPath.startsWith('/events/'))) {
            window.location.href = '/login';
          }
        }
      } else {
        localStorage.removeItem('devarena_token');
        const currentPath = window.location.pathname;
        if (!['/login', '/register', '/', '/explore', '/leaderboard'].some(p => currentPath === p || currentPath.startsWith('/events/'))) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
