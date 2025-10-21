import api from '../api';

export const deseosService = {
  // Obtener items de la wishlist
  async getItems() {
    try {
      const response = await api.get('/deseos/');
      return response.data;
    } catch (error) {
            throw error;
    }
  },

  // Obtener resumen de la wishlist
  async getResumen() {
    try {
      const response = await api.get('/deseos/resumen/');
      return response.data;
    } catch (error) {
            throw error;
    }
  },

  // Toggle producto en wishlist
  async toggleProducto(productoId) {
    try {
      const response = await api.post('/deseos/toggle/', {
        producto_id: productoId
      });
      return response.data;
    } catch (error) {
            throw error;
    }
  },

  // Eliminar producto de wishlist
  async eliminarProducto(deseosId) {
    try {
      const response = await api.delete(`/deseos/${deseosId}/`);
      return response.data;
    } catch (error) {
            throw error;
    }
  }
};