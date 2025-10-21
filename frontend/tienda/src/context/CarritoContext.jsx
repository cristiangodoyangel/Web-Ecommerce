import React, { createContext, useContext, useState, useEffect } from 'react';
import { carritoService } from '../services/carritoService';

const CarritoContext = createContext();

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  }
  return context;
};

export const CarritoProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState({
    total_items: 0,
    total_precio: 0,
    items_count: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [guestData, setGuestData] = useState(null); // Datos del invitado

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

  // Función para validar y limpiar token expirado
  const validateToken = () => {
    const token = localStorage.getItem('access_token');
    if (token && isTokenExpired(token)) {
      // Token expirado, limpiar almacenamiento
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return false;
    }
    return !!token;
  };

  // Verificar autenticación
  useEffect(() => {
    const isValidAuth = validateToken();
    setIsAuthenticated(isValidAuth);
    
    // Cargar datos de invitado si existen y no hay autenticación válida
    const storedGuestData = localStorage.getItem('guest_data');
    if (storedGuestData && !isValidAuth) {
      setGuestData(JSON.parse(storedGuestData));
    }
    
    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      const newIsValidAuth = validateToken();
      const wasAuthenticated = isAuthenticated;
      
      setIsAuthenticated(newIsValidAuth);
      
      // Si el usuario se autenticó, migrar carrito
      if (!wasAuthenticated && newIsValidAuth) {
        migrarCarritoSiEsNecesario();
        setGuestData(null);
        localStorage.removeItem('guest_data');
      }
      // Si cerró sesión o token expiró, recargar carrito (para usar sesión)
      else if (wasAuthenticated && !newIsValidAuth) {
        cargarCarrito();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  // Cargar carrito al iniciar
  useEffect(() => {
    cargarCarrito();
  }, []);

  const migrarCarritoSiEsNecesario = async () => {
    // Si hay items en localStorage (de sesión de invitado), migrarlos
    const sessionKey = localStorage.getItem('guest_session_key');
    if (sessionKey) {
      try {
        await carritoService.migrarCarrito(sessionKey);
        localStorage.removeItem('guest_session_key');
        cargarCarrito();
      } catch (error) {
              }
    }
  };

  const cargarCarrito = async () => {
    setIsLoading(true);
    try {
      // Verificar autenticación pero NO bloquear la carga
      const isValidAuth = validateToken();
      setIsAuthenticated(isValidAuth);
      
      const [itemsData, resumenData] = await Promise.all([
        carritoService.obtenerCarrito(),
        carritoService.obtenerResumen()
      ]);
      
      setItems(itemsData);
      setResumen(resumenData);
      
    } catch (error) {
      console.error('Error cargando carrito:', error);
      // Inicializar vacío en caso de error
      setItems([]);
      setResumen({ total_items: 0, total_precio: 0, items_count: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const agregarProducto = async (productoId, cantidad = 1) => {
    try {
      // NO validar token - permitir usuarios anónimos
      await carritoService.agregarProducto(productoId, cantidad);
      await cargarCarrito(); // Recargar para obtener datos actualizados
      
      return { success: true };
    } catch (error) {
      console.error('Error agregando producto al carrito:', error);
      return { success: false, error: error.message };
    }
  };

  const agregarProductoInvitado = async (productoId, cantidad = 1, datosInvitado) => {
    try {
      // Guardar datos del invitado
      setGuestData(datosInvitado);
      localStorage.setItem('guest_data', JSON.stringify(datosInvitado));
      
      // Agregar producto usando el servicio
      await carritoService.agregarProducto(productoId, cantidad);
      await cargarCarrito();
      return { success: true };
    } catch (error) {
            return { success: false, error: error.message };
    }
  };

  const actualizarCantidad = async (itemId, cantidad) => {
    try {
      // NO validar token - permitir usuarios anónimos
      await carritoService.actualizarCantidad(itemId, cantidad);
      await cargarCarrito();
      return { success: true };
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      return { success: false, error: error.message };
    }
  };

  const eliminarItem = async (itemId) => {
    try {
      // NO validar token - permitir usuarios anónimos
      await carritoService.eliminarItem(itemId);
      await cargarCarrito();
      return { success: true };
    } catch (error) {
      console.error('Error eliminando item:', error);
      return { success: false, error: error.message };
    }
  };

  const limpiarCarrito = async () => {
    try {
      // NO validar token - permitir usuarios anónimos
      await carritoService.limpiarCarrito();
      setItems([]);
      setResumen({ total_items: 0, total_precio: 0, items_count: 0 });
      return { success: true };
    } catch (error) {
      console.error('Error limpiando carrito:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    items,
    resumen,
    isLoading,
    isAuthenticated,
    guestData,
    cargarCarrito,
    agregarProducto,
    agregarProductoInvitado,
    actualizarCantidad,
    eliminarItem,
    limpiarCarrito
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};