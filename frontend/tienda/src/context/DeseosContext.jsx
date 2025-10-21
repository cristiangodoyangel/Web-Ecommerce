import { createContext, useContext, useState, useEffect } from 'react';
import { deseosService } from '../services/deseosService';

const DeseosContext = createContext();

export const useDeseos = () => {
  const context = useContext(DeseosContext);
  if (!context) {
    throw new Error('useDeseos must be used within DeseosProvider');
  }
  return context;
};

export const DeseosProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState({ total_items: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos de la wishlist
  const cargarDeseos = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setItems([]);
      setResumen({ total_items: 0 });
      return;
    }

    setIsLoading(true);
    try {
      const [itemsData, resumenData] = await Promise.all([
        deseosService.getItems(),
        deseosService.getResumen()
      ]);
      setItems(itemsData);
      setResumen(resumenData);
    } catch (error) {
            // Si hay error de autenticación, limpiar datos
      if (error.response?.status === 401) {
        setItems([]);
        setResumen({ total_items: 0 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle producto en wishlist
  const toggleProducto = async (productoId) => {
    try {
      const response = await deseosService.toggleProducto(productoId);
      await cargarDeseos(); // Recargar para obtener datos actualizados
      return { success: true, data: response };
    } catch (error) {
            return { success: false, error: error.response?.data };
    }
  };

  // Eliminar producto de wishlist
  const eliminarProducto = async (deseosId) => {
    try {
      await deseosService.eliminarProducto(deseosId);
      await cargarDeseos();
      return { success: true };
    } catch (error) {
            return { success: false, error: error.response?.data };
    }
  };

  // Verificar si un producto está en wishlist
  const estaEnWishlist = (productoId) => {
    return items.some(item => item.producto.id === productoId);
  };

  useEffect(() => {
    cargarDeseos();
  }, []);

  const value = {
    items,
    resumen,
    isLoading,
    toggleProducto,
    eliminarProducto,
    estaEnWishlist,
    cargarDeseos
  };

  return (
    <DeseosContext.Provider value={value}>
      {children}
    </DeseosContext.Provider>
  );
};