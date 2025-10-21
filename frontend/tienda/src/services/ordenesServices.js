import API_BASE_URL from '../config';

const API_URL = API_BASE_URL;

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const ordenesService = {
  // Obtener historial de compras
  obtenerHistorial: async () => {
    try {
      const response = await fetch(`${API_URL}/ordenes/ordenes/historial/`, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener historial');
      }
      
      return await response.json();
    } catch (error) {
            throw error;
    }
  },

  // Obtener detalle de una orden específica
  obtenerDetalleOrden: async (ordenId) => {
    try {
      const response = await fetch(`${API_URL}/ordenes/ordenes/${ordenId}/detalle_orden/`, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener detalle de orden');
      }
      
      return await response.json();
    } catch (error) {
            throw error;
    }
  }
};