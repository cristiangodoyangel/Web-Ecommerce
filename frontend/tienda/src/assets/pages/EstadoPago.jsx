import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Check, X, Clock, AlertCircle, Home, ShoppingBag } from 'lucide-react';
import { mercadoPagoService } from '../../services/carritoService';

const EstadoPago = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ordenId } = useParams();
  const [estado, setEstado] = useState('verificando');
  const [datosPago, setDatosPago] = useState(null);
  const [error, setError] = useState('');

  // Parámetros que MercadoPago envía en la URL de retorno
  const collection_status = searchParams.get('collection_status');
  const payment_id = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const external_reference = searchParams.get('external_reference');
  const preference_id = searchParams.get('preference_id');

  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Si es una URL de procesar pago, crear preferencia y redirigir
    if (currentPath.includes('/pago/procesar/') && ordenId) {
      // Si ya viene preference_id en la URL, usarlo directamente
      if (preference_id) {
        inicializarMercadoPago(preference_id);
        setEstado('listo');
      } else {
        procesarPago();
      }
    } else {
      verificarEstadoPago();
    }
  }, [ordenId, preference_id]);

  const procesarPago = async () => {
    try {
      setEstado('procesando');
      const response = await mercadoPagoService.crearPreferencia(ordenId);
      
      if (response.preference_id) {
        // Inicializar MercadoPago con la preferencia
        inicializarMercadoPago(response.preference_id);
        setEstado('listo');
      } else {
        setError('Error al crear la preferencia de pago');
        setEstado('error');
      }
    } catch (error) {
            setError('Error al procesar el pago');
      setEstado('error');
    }
  };

  const inicializarMercadoPago = (preferenceId) => {
    // Cargar script de MercadoPago si no está cargado
    if (!window.MercadoPago) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => {
        renderizarBotonPago(preferenceId);
      };
      script.onerror = () => {
        setError('Error al cargar MercadoPago SDK');
        setEstado('error');
      };
      document.head.appendChild(script);
    } else {
      renderizarBotonPago(preferenceId);
    }
  };

  const renderizarBotonPago = (preferenceId) => {
    try {
      // Inicializar SDK con Public Key desde variables de entorno
      const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'APP_USR-c551ad7e-92fc-461c-a4a6-b4fd364d08f4';
      const mp = new window.MercadoPago(publicKey);
      
      // Crear Wallet Brick según documentación oficial
      const bricksBuilder = mp.bricks();
      
      // Limpiar contenedor previo
      const container = document.getElementById('walletBrick_container');
      if (container) {
        container.innerHTML = '';
      }
      
      bricksBuilder.create('wallet', 'walletBrick_container', {
        initialization: {
          preferenceId: preferenceId
        }
      });
      
    } catch (error) {
            setError('Error al inicializar el pago con MercadoPago');
      setEstado('error');
    }
  };

  const verificarEstadoPago = async () => {
    try {
      setEstado('verificando');

      // TODO: Implementar verificación de pago cuando se configure la pasarela
      // Determinar estado basado en URL por ahora
      const currentPath = window.location.pathname;
      if (currentPath.includes('exitoso')) {
        setEstado('exitoso');
      } else if (currentPath.includes('fallido')) {
        setEstado('rechazado');
      } else if (currentPath.includes('pendiente')) {
        setEstado('pendiente');
      } else {
        // Si no hay información específica, usar los parámetros de la URL
        if (status === 'approved' || collection_status === 'approved') {
          setEstado('exitoso');
        } else if (status === 'rejected' || collection_status === 'rejected') {
          setEstado('rechazado');
        } else if (status === 'pending' || collection_status === 'pending') {
          setEstado('pendiente');
        } else {
          setEstado('desconocido');
        }
      }
    } catch (error) {
            setError('Error de conexión al verificar el pago');
      setEstado('error');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getEstadoInfo = () => {
    switch (estado) {
      case 'exitoso':
        return {
          icon: <Check className="h-12 w-12 text-green-600" />,
          bgColor: 'bg-green-100',
          title: '¡Pago Exitoso!',
          titleColor: 'text-green-800',
          message: 'Tu pago se ha procesado correctamente. Recibirás un email de confirmación.',
          actions: [
            {
              text: 'Ver Mi Historial',
              onClick: () => navigate('/historial-compras'),
              primary: true
            },
            {
              text: 'Seguir Comprando',
              onClick: () => navigate('/'),
              primary: false
            }
          ]
        };
      
      case 'pendiente':
        return {
          icon: <Clock className="h-12 w-12 text-yellow-600" />,
          bgColor: 'bg-yellow-100',
          title: 'Pago Pendiente',
          titleColor: 'text-yellow-800',
          message: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
          actions: [
            {
              text: 'Ver Mi Historial',
              onClick: () => navigate('/historial-compras'),
              primary: true
            },
            {
              text: 'Inicio',
              onClick: () => navigate('/'),
              primary: false
            }
          ]
        };
      
      case 'rechazado':
        return {
          icon: <X className="Display h-12 w-12 text-red-600" />,
          bgColor: 'bg-red-100',
          title: 'Pago Rechazado',
          titleColor: 'text-red-800',
          message: 'Tu pago no pudo ser procesado. Verifica los datos de tu tarjeta o intenta con otro método.',
          actions: [
            {
              text: 'Intentar Nuevamente',
              onClick: () => navigate('/carrito'),
              primary: true
            },
            {
              text: 'Ir al Inicio',
              onClick: () => navigate('/'),
              primary: false
            }
          ]
        };
      
      case 'error':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-600" />,
          bgColor: 'bg-red-100',
          title: 'Error de Verificación',
          titleColor: 'text-red-800',
          message: error || 'No pudimos verificar el estado de tu pago. Contacta con soporte.',
          actions: [
            {
              text: 'Reintentar',
              onClick: verificarEstadoPago,
              primary: true
            },
            {
              text: 'Ir al Inicio',
              onClick: () => navigate('/'),
              primary: false
            }
          ]
        };
      
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-gray-600" />,
          bgColor: 'bg-gray-100',
          title: 'Estado Desconocido',
          titleColor: 'text-gray-800',
          message: 'No pudimos determinar el estado de tu pago.',
          actions: [
            {
              text: 'Contactar Soporte',
              onClick: () => navigate('/'),
              primary: true
            }
          ]
        };
    }
  };

  if (estado === 'verificando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: '#f83258' }}></div>
          <p style={{ color: '#8c000f' }}>Verificando estado del pago...</p>
        </div>
      </div>
    );
  }

  if (estado === 'procesando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: '#f83258' }}></div>
          <p style={{ color: '#8c000f' }}>Preparando tu pago...</p>
          <p className="text-gray-600 mt-2">Serás redirigido a MercadoPago en un momento</p>
        </div>
      </div>
    );
  }

  if (estado === 'listo') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#8c000f' }}>
                Procesar Pago
              </h2>
              <p className="text-gray-600">
                Tu orden #{ordenId} está lista para ser procesada
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Pago seguro con MercadoPago</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Selecciona tu método de pago preferido
              </p>
            </div>

            {/* Container para el botón de MercadoPago */}
            <div id="walletBrick_container" className="mb-6"></div>

            <div className="text-center">
              <button 
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Volver al checkout
              </button>
            </div>

            <div className="text-xs text-gray-500 text-center mt-4">
              <p>Al continuar, serás redirigido a la plataforma segura de MercadoPago.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className={`mx-auto w-20 h-20 ${estadoInfo.bgColor} rounded-full flex items-center justify-center mb-4`}>
              {estadoInfo.icon}
            </div>
            <CardTitle className={estadoInfo.titleColor}>
              {estadoInfo.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Mensaje principal */}
            <div className="text-center">
              <p className="text-gray-600 text-lg">
                {estadoInfo.message}
              </p>
            </div>

            {/* Información del pago */}
            {datosPago && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Detalles del Pago</h3>
                <div className="space-y-2">
                  {datosPago.amount && (
                    <div className="flex justify-between">
                      <span>Monto:</span>
                      <span className="font-semibold">{formatPrice(datosPago.amount)}</span>
                    </div>
                  )}
                  {payment_id && (
                    <div className="flex justify-between">
                      <span>ID de Pago:</span>
                      <span className="font-mono text-sm">{payment_id}</span>
                    </div>
                  )}
                  {external_reference && (
                    <div className="flex justify-between">
                      <span>Orden:</span>
                      <span>#{external_reference.replace('orden_', '')}</span>
                    </div>
                  )}
                  {datosPago.payment_method && (
                    <div className="flex justify-between">
                      <span>Método de Pago:</span>
                      <span className="capitalize">{datosPago.payment_method}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="space-y-3">
              {estadoInfo.actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={`w-full ${action.primary 
                    ? 'text-white' 
                    : 'bg-white border border-gray-300'
                  }`}
                  style={action.primary ? { backgroundColor: '#8c000f' } : { color: '#8c000f' }}
                >
                  {action.primary && index === 0 && estado === 'exitoso' && (
                    <ShoppingBag className="h-5 w-5 mr-2" />
                  )}
                  {action.primary && index === 0 && estado !== 'exitoso' && (
                    <Home className="h-5 w-5 mr-2" />
                  )}
                  {action.text}
                </Button>
              ))}
            </div>

            {/* Información adicional */}
            {estado === 'exitoso' && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">¿Qué sigue?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Recibirás un email de confirmación</li>
                  <li>• Preparamos tu pedido en 24-48 horas</li>
                  <li>• Te notificaremos cuando sea enviado</li>
                  <li>• Puedes rastrear tu pedido en "Mi Historial"</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstadoPago;