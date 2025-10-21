import { useState, useEffect } from 'react';
import { useCarrito } from '../../context/CarritoContext';
import { ordenService, carritoService, mercadoPagoService } from '../../services/carritoService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, CreditCard, User, Mail, Phone, MapPin, ShoppingBag, Check, Truck, Store } from 'lucide-react';

const Checkout = () => {
  const { items, resumen, isAuthenticated, isLoading } = useCarrito();
  const [step, setStep] = useState(1); // 1: Info, 2: Resumen, 3: Confirmación
  const [processing, setProcessing] = useState(false);
  const [ordenCreada, setOrdenCreada] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [mercadoPagoLoaded, setMercadoPagoLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    telefono: '',
    direccion: '',
    metodo_entrega: 'delivery' // Valor por defecto
  });
  
  const [errors, setErrors] = useState({});

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    const metodoEntregaGuardado = localStorage.getItem('metodo_entrega');
    if (metodoEntregaGuardado) {
      setFormData(prev => ({
        ...prev,
        metodo_entrega: metodoEntregaGuardado
      }));
    }
  }, []);

  useEffect(() => {
    // Esperar un momento para que el carrito se cargue antes de redirigir
    const timer = setTimeout(() => {
      // Solo redirigir si ya no está cargando y definitivamente no hay items
      if (!isLoading && items.length === 0) {
        window.location.href = '/carrito';
      }
    }, 1000); // Esperar 1 segundo

    return () => clearTimeout(timer);
  }, [items, isLoading]);

  // Cargar información del usuario autenticado
  useEffect(() => {
    const cargarPerfilUsuario = async () => {
      if (isAuthenticated && !userProfile) {
        try {
          const perfil = await carritoService.obtenerPerfilUsuario();
          setUserProfile(perfil);
        } catch (error) {
          console.error('Error al cargar perfil:', error);
        }
      }
    };

    cargarPerfilUsuario();
  }, [isAuthenticated, userProfile]);

  // Limpiar órdenes pendientes previas al montar el componente
  useEffect(() => {
    // Limpiar cualquier orden pendiente almacenada localmente
    const ordenPendiente = localStorage.getItem('orden_pendiente');
    if (ordenPendiente) {
      localStorage.removeItem('orden_pendiente');
    }
    
    // Resetear estados al montar
    setOrdenCreada(null);
    setProcessing(false);
    setErrors({});
  }, []); // Solo se ejecuta al montar

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calcular costo de envío basado en los datos almacenados
  const calcularCostoEnvio = () => {
    const totalProductos = resumen.total_precio || 0;
    const envioGratisDesbloqueado = totalProductos >= 50000;
    
    const costoGuardado = localStorage.getItem('costo_envio');
    if (costoGuardado) {
      return parseInt(costoGuardado);
    }
    
    if (formData.metodo_entrega === 'retiro') return 0;
    if (envioGratisDesbloqueado) return 0;
    return 3500;
  };

  const estaEnvioGratis = () => {
    const totalProductos = resumen.total_precio || 0;
    return totalProductos >= 50000 && formData.metodo_entrega === 'delivery';
  };

  // Calcular total incluyendo envío
  const calcularTotal = () => {
    return resumen.total_precio + calcularCostoEnvio();
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }
    
    // La dirección solo es requerida si se selecciona delivery
    if (formData.metodo_entrega === 'delivery' && !formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida para delivery';
    }
    
    if (!formData.metodo_entrega) {
      newErrors.metodo_entrega = 'Debe seleccionar un método de entrega';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !isAuthenticated) {
      if (!validateForm()) {
        return;
      }
    }
    
    // Si va al paso 2, automáticamente crear orden y preferencia
    if (step === 1) {
      setStep(2);
      // Crear orden inmediatamente al llegar al paso 2
      setTimeout(() => {
        handleFinalizarCompra();
      }, 100);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setStep(prev => prev - 1);
  };

  // Funciones de MercadoPago
  const cargarMercadoPagoSDK = () => {
    if (!window.MercadoPago && !mercadoPagoLoaded) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => {
        setMercadoPagoLoaded(true);
        if (ordenCreada?.preference_id) {
          renderizarWalletBrick(ordenCreada.preference_id);
        }
      };
      script.onerror = () => {
        console.error('Error al cargar SDK de MercadoPago');
        setErrors({ general: 'Error al cargar el sistema de pagos' });
      };
      document.head.appendChild(script);
    } else if (window.MercadoPago && ordenCreada?.preference_id) {
      renderizarWalletBrick(ordenCreada.preference_id);
    }
  };

  const renderizarWalletBrick = (preferenceId) => {
    try {
      const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'APP_USR-c551ad7e-92fc-461c-a4a6-b4fd364d08f4';
      
      const mp = new window.MercadoPago(publicKey);
      const bricksBuilder = mp.bricks();
      
      // Limpiar contenedor previo
      const container = document.getElementById('checkout_walletBrick_container');
      if (container) {
        container.innerHTML = '';
        
        bricksBuilder.create('wallet', 'checkout_walletBrick_container', {
          initialization: {
            preferenceId: preferenceId
          },
          callbacks: {
            onReady: () => {
              // Brick listo
            },
            onSubmit: () => {
              // Redirigir a MercadoPago - el usuario volverá a las URLs configuradas
            },
            onError: (error) => {
              console.error('Error en Wallet Brick:', error);
              setErrors({ general: 'Error en el sistema de pagos' });
            }
          }
        });
      } else {
        console.error('Contenedor de Wallet Brick no encontrado');
      }
    } catch (error) {
      console.error('Error al renderizar Wallet Brick:', error);
      setErrors({ general: 'Error al inicializar el sistema de pagos' });
    }
  };

  // Cargar MercadoPago cuando se crea la orden y hay preference_id
  useEffect(() => {
    if (ordenCreada?.preference_id && ordenCreada?.mercadopago_ready) {
      cargarMercadoPagoSDK();
    }
  }, [ordenCreada?.preference_id, ordenCreada?.mercadopago_ready]);

  const handleFinalizarCompra = async () => {
    setProcessing(true);
    
    try {
      let result;
      
      // Asegurarse de obtener los datos del localStorage para usuarios invitados
      const metodoEntregaGuardado = localStorage.getItem('metodo_entrega') || 'delivery';
      const datosParaEnvio = {
        ...formData,
        metodo_entrega: metodoEntregaGuardado
      };
      
      console.log('📦 Datos enviados al backend:', datosParaEnvio);
      
      if (isAuthenticated) {
        // Usuario autenticado - mantener flujo anterior (por ahora)
        result = await ordenService.crearOrdenUsuario({ 
          metodo_entrega: metodoEntregaGuardado 
        });
        
        // Crear preferencia con orden_id para usuarios autenticados
        const ordenId = result.orden_id || result.orden?.id;
        if (ordenId) {
          const preferenciaResponse = await mercadoPagoService.crearPreferencia(ordenId);
          
          if (preferenciaResponse.preference_id) {
            const ordenCompleta = {
              id: ordenId,
              orden_id: ordenId,
              total: result.total || result.orden?.total,
              preference_id: preferenciaResponse.preference_id,
              init_point: preferenciaResponse.init_point,
              sandbox_init_point: preferenciaResponse.sandbox_init_point,
              mercadopago_ready: true,
              ...result
            };
            
            setOrdenCreada(ordenCompleta);
          } else {
            throw new Error('No se recibió el preference_id de MercadoPago');
          }
        }
      } else {
        // Usuario invitado - NUEVO FLUJO: Preparar pago sin crear orden
        result = await ordenService.prepararPagoInvitado(datosParaEnvio);
        
        // Crear preferencia directamente con session_key (sin crear orden)
        const sessionKey = result.session_key;
        if (sessionKey) {
          const preferenciaResponse = await mercadoPagoService.crearPreferenciaDesdeCarrito(sessionKey);
          
          if (preferenciaResponse.preference_id) {
            const ordenCompleta = {
              session_key: sessionKey,
              total: result.total,
              preference_id: preferenciaResponse.preference_id,
              init_point: preferenciaResponse.init_point,
              sandbox_init_point: preferenciaResponse.sandbox_init_point,
              mercadopago_ready: true,
              metodo_entrega: result.metodo_entrega,
              costo_envio: result.costo_envio,
              es_invitado: true // Flag para identificar el nuevo flujo
            };
            
            setOrdenCreada(ordenCompleta);
          } else {
            throw new Error('No se recibió el preference_id de MercadoPago');
          }
        } else {
          throw new Error('No se pudo obtener el session_key');
        }
      }
      
    } catch (error) {
      console.error('Error al procesar la orden:', error);
      
      // Mejor manejo de errores
      let errorMessage = 'Error al procesar la orden';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#f83258' }}></div>
          <p style={{ color: '#8c000f' }}>Cargando checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="display min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/carrito'}
              className="flex items-center gap-2"
              style={{ color: '#8c000f' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Carrito
            </Button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#8c000f' }}>
                Finalizar Compra
              </h1>
              <p className="text-gray-600 mt-1">
                {!isAuthenticated ? 'Checkout como invitado' : 'Checkout'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {/* Step 1 */}
            <div className={`flex items-center ${step >= 1 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="ml-2 hidden sm:inline">
                {isAuthenticated ? 'Información' : 'Datos Personales'}
              </span>
            </div>
            
            <div className="w-12 h-px bg-gray-300"></div>
            
            {/* Step 2 */}
            <div className={`flex items-center ${step >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 2 ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <span className="ml-2 hidden sm:inline">Resumen</span>
            </div>
            
            <div className="w-12 h-px bg-gray-300"></div>
            
            {/* Step 3 */}
            <div className={`flex items-center ${step >= 3 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-red-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 hidden sm:inline">Confirmación</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#8c000f' }}>
                    <User className="h-5 w-5" />
                    {isAuthenticated ? 'Confirmar Información' : 'Información de Contacto'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isAuthenticated && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="tu@email.com"
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre Completo *
                        </label>
                        <Input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          placeholder="Tu nombre completo"
                          className={errors.nombre ? 'border-red-500' : ''}
                        />
                        {errors.nombre && (
                          <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono *
                        </label>
                        <Input
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          placeholder="+56 9 1234 5678"
                          className={errors.telefono ? 'border-red-500' : ''}
                        />
                        {errors.telefono && (
                          <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dirección de Envío {formData.metodo_entrega === 'delivery' ? '*' : '(Opcional)'}
                        </label>
                        <textarea
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleInputChange}
                          placeholder={formData.metodo_entrega === 'delivery' 
                            ? "Calle, número, comuna, región" 
                            : "Dirección opcional para referencia"
                          }
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                            errors.direccion ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.direccion && (
                          <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
                        )}
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Información Importante
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          Como invitado, recibirás la confirmación de tu pedido en el email proporcionado. 
                          Si deseas crear una cuenta para hacer seguimiento de tus pedidos, puedes hacerlo después de completar la compra.
                        </p>
                      </div>
                    </>
                  )}

                  {isAuthenticated && (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Datos para la compra
                          </span>
                        </div>
                        
                        {userProfile ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-green-600" />
                                <span className="text-green-700">
                                  <strong>Nombre:</strong> {userProfile.first_name} {userProfile.last_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-green-600" />
                                <span className="text-green-700">
                                  <strong>Email:</strong> {userProfile.email}
                                </span>
                              </div>
                              {userProfile.telefono && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-green-600" />
                                  <span className="text-green-700">
                                    <strong>Teléfono:</strong> {userProfile.telefono}
                                  </span>
                                </div>
                              )}
                              {userProfile.direccion && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-green-600" />
                                  <span className="text-green-700">
                                    <strong>Dirección:</strong> {userProfile.direccion}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                              Esta información será utilizada para procesar tu orden.
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-green-700">
                            Cargando información del usuario...
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleNextStep}
                      className="px-6 py-2 text-white"
                      style={{ backgroundColor: '#f83258' }}
                    >
                      Continuar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#8c000f' }}>
                    <ShoppingBag className="h-5 w-5" />
                    Resumen del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 py-4 border-b">
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          {item.producto.imagen ? (
                            <img 
                              src={item.producto.imagen} 
                              alt={item.producto.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.producto.nombre}</h4>
                          <p className="text-sm text-gray-500">
                            Cantidad: {item.cantidad}
                          </p>
                          <p className="text-sm font-medium" style={{ color: '#8c000f' }}>
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isAuthenticated && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Información de Envío:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Nombre:</strong> {formData.nombre}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Teléfono:</strong> {formData.telefono}</p>
                        <p><strong>Dirección:</strong> {formData.direccion}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-6">
                    {/* Mostrar loading mientras se crea la orden, luego botón de pago */}
                    {ordenCreada?.mercadopago_ready && ordenCreada?.preference_id ? (
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-center">
                          Completa tu pago con MercadoPago
                        </h4>
                        <div id="checkout_walletBrick_container" className="mb-4"></div>
                        
                        {/* Botón de volver */}
                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={handlePreviousStep}
                            className="w-full"
                          >
                            ← Volver
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 mb-4">Preparando tu orden...</p>
                        <p className="text-sm text-gray-500">En unos segundos aparecerá el botón de pago</p>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            onClick={handlePreviousStep}
                          >
                            ← Volver
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Mostrar errores si los hay */}
                    {errors.general && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">{errors.general}</p>
                        <div className="mt-3 flex justify-center">
                          <Button
                            onClick={() => {
                              setErrors({});
                              handleFinalizarCompra(); // Reintentar
                            }}
                            className="px-4 py-2 text-white text-sm"
                            style={{ backgroundColor: '#f83258' }}
                          >
                            Reintentar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && ordenCreada && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Check className="h-6 w-6" />
                    ¡Pago Completado!
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      ¡Gracias por tu compra!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Tu pago ha sido procesado exitosamente.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600">Número de Orden:</p>
                      <p className="text-xl font-bold" style={{ color: '#8c000f' }}>
                        #{ordenCreada.id || ordenCreada.orden_id}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">Total:</p>
                      <p className="text-xl font-bold" style={{ color: '#8c000f' }}>
                        {formatPrice(ordenCreada.total || total)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => window.location.href = '/'}
                      className="w-full py-2 text-white"
                      style={{ backgroundColor: '#f83258' }}
                    >
                      Continuar Comprando
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                      className="w-full"
                    >
                      Imprimir Confirmación
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumen lateral */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: '#8c000f' }}>
                  Resumen
                </h3>

                {/* Mensaje de felicitaciones por envío gratis */}
                {estaEnvioGratis() && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-bold text-sm">
                        ¡FELICITACIONES!
                      </span>
                    </div>
                    <p className="text-green-700 text-sm font-medium">
                      HAS DESBLOQUEADO EL ENVÍO GRATIS
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      Compras sobre $50.000 tienen envío gratuito
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productos ({resumen.total_items}):</span>
                    <span className="font-medium">{formatPrice(resumen.total_precio)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Envío ({formData.metodo_entrega === 'delivery' ? 'Delivery' : 'Retiro en tienda'}):
                    </span>
                    <span className={`font-medium ${calcularCostoEnvio() === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {calcularCostoEnvio() === 0 ? 'Gratis' : formatPrice(calcularCostoEnvio())}
                    </span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span style={{ color: '#8c000f' }}>Total:</span>
                    <span style={{ color: '#8c000f' }}>
                      {formatPrice(calcularTotal())}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Delivery disponible Lunes a Viernes ($3.500)</p>
                  <p>• Retiro en tienda Lunes a Sábado (Gratis)</p>
                  <p>• Los precios incluyen IVA</p>
                  <p>• Tiempo de entrega: 2-5 días hábiles</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;