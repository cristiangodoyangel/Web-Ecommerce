// src/api.js
import axios from 'axios';
import API_BASE_URL from './config';

const API_URL = `${API_BASE_URL}/productos/`;
const BASE_URL = `${API_BASE_URL}/`; 

export const fetchProducts = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data; // Devuelve los datos de los productos
  } catch (error) {
        return [];
  }
};

const api = axios.create({
  baseURL: BASE_URL,
});

// Función para obtener el token del almacenamiento local
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Función para obtener el refresh token
const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

// Función para verificar si el token está expirado
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Función para renovar el token
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(`${BASE_URL}auth/token/refresh/`, {
      refresh: refreshToken
    });
    
    const newAccessToken = response.data.access;
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (error) {
    // Si falla el refresh, limpiar tokens y redirigir al login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw error;
  }
};

// Interceptor para añadir el token JWT en las peticiones
api.interceptors.request.use(
  async (config) => {
    let token = getAuthToken();
    
    // Verificar si el token está expirado
    if (token && isTokenExpired(token)) {
      try {
        token = await refreshAccessToken();
      } catch (error) {
                return Promise.reject(error);
      }
    }
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas 401 (token expirado)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
                // Redirigir al login si falla la renovación
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;