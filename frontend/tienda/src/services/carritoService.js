import API_BASE_URL from '../config';

const API_URL = API_BASE_URL;

// DEBUG: Verificar conectividad con backend
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
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    const newAccessToken = data.access;
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (error) {
    // Si falla el refresh, limpiar tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw error;
  }
};

// Función para obtener headers con token si está autenticado
const getHeaders = async (requireAuth = false) => {
  let token = localStorage.getItem('access_token');
  
  // Verificar si el token está expirado y renovarlo si es necesario
  if (token && isTokenExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch (error) {
      console.log('Token refresh failed, continuing without auth');
      token = null;
    }
  }
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Solo agregar Authorization si hay token válido o si es requerido
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (requireAuth) {
    throw new Error('Authentication required but no valid token available');
  }
  
  return headers;
};

// Función para obtener configuración de fetch
const getFetchConfig = async (requireAuth = false) => {
  const config = {
    headers: await getHeaders(requireAuth),
    credentials: 'include', // Importante para incluir cookies de sesión (para usuarios anónimos)
  };
  
  return config;
};

// Función para manejar respuestas y errores 401
const handleResponse = async (response, originalRequest, requireAuth = false) => {
  if (response.status === 401 && requireAuth) {
    // Intentar renovar token y reintentar la petición solo si la autenticación es requerida
    try {
      await refreshAccessToken();
      return await originalRequest();
    } catch (error) {
      throw new Error('Authentication failed');
    }
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error: ${response.status}`);
  }
  
  return response;
};

// Función para obtener un token válido (renovándolo si es necesario)
const obtenerTokenValido = async () => {
  let token = localStorage.getItem('access_token');
  
  // Verificar si el token está expirado y renovarlo si es necesario
  if (token && isTokenExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch (error) {
            throw new Error('No se pudo obtener un token válido');
    }
  }
  
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  return token;
};

export const carritoService = {
  // Obtener items del carrito (no requiere autenticación - permite usuarios anónimos)
  obtenerCarrito: async () => {
    const makeRequest = async () => {
      const config = await getFetchConfig(false); // No requiere auth
      return await fetch(`${API_URL}/carrito/`, config);
    };
    
    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest, false);
      return await handledResponse.json();
    } catch (error) {
      throw error;
    }
  },

  // Agregar producto al carrito (no requiere autenticación - permite usuarios anónimos)
  agregarProducto: async (productoId, cantidad = 1) => {
    const makeRequest = async () => {
      const config = await getFetchConfig(false); // No requiere auth
      return await fetch(`${API_URL}/carrito/`, {
        method: 'POST',
        ...config,
        body: JSON.stringify({
          producto: productoId,
          cantidad: cantidad
        })
      });
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest, false);
      return await handledResponse.json();
    } catch (error) {
      throw error;
    }
  },  // Actualizar cantidad (no requiere autenticación - permite usuarios anónimos)
  actualizarCantidad: async (itemId, cantidad) => {
    const makeRequest = async () => {
      const config = await getFetchConfig(false); // No requiere auth
      return await fetch(`${API_URL}/carrito/${itemId}/`, {
        method: 'PATCH',
        ...config,
        body: JSON.stringify({ cantidad })
      });
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest, false);
      return await handledResponse.json();
    } catch (error) {
      throw error;
    }
  },

  // Eliminar item del carrito (no requiere autenticación - permite usuarios anónimos)
  eliminarItem: async (itemId) => {
    const makeRequest = async () => {
      const config = await getFetchConfig(false); // No requiere auth
      return await fetch(`${API_URL}/carrito/${itemId}/`, {
        method: 'DELETE',
        ...config
      });
    };

    try {
      const response = await makeRequest();
      await handleResponse(response, makeRequest, false);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Obtener resumen del carrito (no requiere autenticación - permite usuarios anónimos)
  obtenerResumen: async () => {
    const makeRequest = async () => {
      const config = await getFetchConfig(false); // No requiere auth
      return await fetch(`${API_URL}/carrito/resumen/`, config);
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest, false);
      const data = await handledResponse.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Limpiar carrito (no requiere autenticación - permite usuarios anónimos)
  limpiarCarrito: async () => {
    const makeRequest = async () => {
      const config = await getFetchConfig(false); // No requiere auth
      return await fetch(`${API_URL}/carrito/limpiar/`, {
        method: 'DELETE',
        ...config
      });
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest, false);
      return await handledResponse.json();
    } catch (error) {
      throw error;
    }
  },

  // Migrar carrito de invitado a usuario (cuando se autentica) - REQUIERE autenticación
  migrarCarrito: async (sessionKey) => {
    const makeRequest = async () => {
      const config = await getFetchConfig(true); // SÍ requiere auth
      return await fetch(`${API_URL}/carrito/migrar_a_usuario/`, {
        method: 'POST',
        ...config,
        body: JSON.stringify({ session_key: sessionKey })
      });
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest);
      return await handledResponse.json();
    } catch (error) {
            throw error;
    }
  },

  // Obtener perfil del usuario autenticado
  obtenerPerfilUsuario: async () => {
    const makeRequest = async () => {
      const token = await obtenerTokenValido();
      
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      return await fetch(`${API_URL}/usuarios/perfil/`, config);
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest);
      return await handledResponse.json();
    } catch (error) {
            throw error;
    }
  }
};

// Servicio para órdenes de invitados
export const ordenService = {
  // Crear orden de usuario autenticado - REQUIERE autenticación
  crearOrdenUsuario: async (datos = {}) => {
    const makeRequest = async () => {
      const config = await getFetchConfig(true); // SÍ requiere auth
      return await fetch(`${API_URL}/ordenes/ordenes/crear_orden_usuario/`, {
        method: 'POST',
        ...config,
        body: JSON.stringify(datos) // Enviar datos adicionales como método de entrega
      });
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest, true);
      return await handledResponse.json();
    } catch (error) {
      throw error;
    }
  },

  // Crear orden de invitado (no requiere autenticación) - MÉTODO ANTERIOR
  crearOrdenInvitado: async (datosInvitado) => {
    const makeRequest = async () => {
      const config = await getFetchConfig(false); // No requiere auth
      return await fetch(`${API_URL}/ordenes/ordenes/crear_orden_invitado/`, {
        method: 'POST',
        ...config,
        body: JSON.stringify(datosInvitado)
      });
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest, false);
      return await handledResponse.json();
    } catch (error) {
      throw error;
    }
  },

  // NUEVO: Preparar pago de invitado sin crear orden (hasta que se confirme pago)
  prepararPagoInvitado: async (datosInvitado) => {
    const makeRequest = async () => {
      const config = await getFetchConfig(false); // No requiere auth
      return await fetch(`${API_URL}/ordenes/ordenes/preparar_pago_invitado/`, {
        method: 'POST',
        ...config,
        body: JSON.stringify(datosInvitado)
      });
    };

    try {
      const response = await makeRequest();
      const handledResponse = await handleResponse(response, makeRequest, false);
      return await handledResponse.json();
    } catch (error) {
      throw error;
    }
  }
};

// Servicio para MercadoPago siguiendo documentación oficial
export const mercadoPagoService = {
  // Crear preferencia de pago (usuarios autenticados e invitados)
  crearPreferencia: async (ordenId) => {
    const makeRequest = async () => {
      // Verificar si hay token (usuario autenticado) o no (invitado)
      const accessToken = localStorage.getItem('access_token');
      let token = null;
      
      if (accessToken && !isTokenExpired(accessToken)) {
        token = accessToken;
      } else if (accessToken && isTokenExpired(accessToken)) {
        try {
          token = await refreshAccessToken();
        } catch (error) {
          // Si falla el refresh, continuar sin token (usuario invitado)
                    token = null;
        }
      }
      
      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Solo agregar Authorization si hay token
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      return await fetch(`${API_URL}/pagos/pagos/crear-preferencia/`, {
        ...config,
        body: JSON.stringify({ orden_id: ordenId })
      });
    };

    try {
      const response = await makeRequest();
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
            throw error;
    }
  },

  // NUEVO: Crear preferencia desde carrito (sin orden creada) para invitados
  crearPreferenciaDesdeCarrito: async (sessionKey) => {
    const makeRequest = async () => {
      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      return await fetch(`${API_URL}/pagos/pagos/crear-preferencia/`, {
        ...config,
        body: JSON.stringify({ session_key: sessionKey })
      });
    };

    try {
      const response = await makeRequest();
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Verificar estado del pago (usuarios autenticados e invitados)
  verificarPago: async (pagoId) => {
    const makeRequest = async () => {
      // Verificar si hay token (usuario autenticado) o no (invitado)
      const accessToken = localStorage.getItem('access_token');
      let token = null;
      
      if (accessToken && !isTokenExpired(accessToken)) {
        token = accessToken;
      } else if (accessToken && isTokenExpired(accessToken)) {
        try {
          token = await refreshAccessToken();
        } catch (error) {
          // Si falla el refresh, continuar sin token (usuario invitado)
                    token = null;
        }
      }
      
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Solo agregar Authorization si hay token
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      return await fetch(`${API_URL}/pagos/${pagoId}/`, config);
    };

    try {
      const response = await makeRequest();
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
            throw error;
    }
  }
};