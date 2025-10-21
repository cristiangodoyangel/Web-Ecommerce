import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mercadoPagoService } from '../../services/carritoService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, CreditCard, Loader2, Clock, AlertCircle } from 'lucide-react';

const ProcesarPago = () => {
  const { ordenId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferencia, setPreferencia] = useState(null);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | procesando | error

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    if (ordenId) crearPreferencia();
  }, [ordenId]);

  const crearPreferencia = async () => {
    try {
      setLoading(true);
      const response = await mercadoPagoService.crearPreferencia(ordenId);
      if (response.success) {
        setPreferencia(response);
        setEstado('listo');
      } else {
        setError(response.error || 'Error al inicializar el pago');
        setEstado('error');
      }
    } catch (err) {
      setError('Error al preparar el pago. Por favor, intenta nuevamente.');
      setEstado('error');
    } finally {
      setLoading(false);
    }
  };

  const procesarPagoMercadoPago = () => {
    if (!preferencia) {
      setError('No se pudo obtener la preferencia de pago');
      setEstado('error');
      return;
    }
    setEstado('procesando');
    const initPoint = preferencia.init_point || preferencia.sandbox_init_point;
    window.location.href = initPoint;
  };

  const handleVolver = () => navigate('/carrito');

  // Estados visuales
  if (loading || estado === 'cargando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#f83258' }}
          ></div>
          <p style={{ color: '#8c000f' }}>Preparando el pago...</p>
        </div>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Error al procesar pago</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={crearPreferencia} style={{ backgroundColor: '#8c000f', color: 'white' }} className="w-full">
              Reintentar
            </Button>
            <Button variant="outline" onClick={handleVolver} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Carrito
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle style={{ color: '#8c000f' }}>
              <CreditCard className="h-5 w-5 inline mr-2" />
              Procesar Pago
            </CardTitle>
            <p className="text-gray-600">Orden #{ordenId}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Resumen de pago */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Resumen del Pago</h3>
              <div className="flex justify-between items-center">
                <span>Total a pagar:</span>
                <span className="text-xl font-bold" style={{ color: '#8c000f' }}>
                  {preferencia?.amount ? formatPrice(preferencia.amount) : 'Calculando...'}
                </span>
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-blue-800">Métodos de Pago Disponibles</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Tarjetas de crédito y débito</li>
                <li>• Transferencia bancaria</li>
                <li>• Efectivo (PagoFácil, Rapipago)</li>
                <li>• Hasta 12 cuotas sin interés*</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                *Promociones sujetas a términos y condiciones del banco emisor.
              </p>
            </div>

            {/* Botón de pago */}
            <Button
              onClick={procesarPagoMercadoPago}
              disabled={estado === 'procesando'}
              className="w-full py-3 text-lg"
              style={{ backgroundColor: '#009ee3', color: 'white' }}
            >
              {estado === 'procesando' ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Redirigiendo a MercadoPago...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pagar con MercadoPago
                </>
              )}
            </Button>

            <div className="text-center">
              <img
                src="https://imgmp.mlstatic.com/org-img/banners/ar/medios/785X40.jpg"
                alt="Medios de pago MercadoPago"
                className="mx-auto max-w-full h-auto"
              />
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
              Pago 100% seguro con MercadoPago 🔒
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcesarPago;
