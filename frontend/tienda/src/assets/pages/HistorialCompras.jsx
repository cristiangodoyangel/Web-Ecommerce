import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ordenesService } from '../../services/ordenesServices';

export default function HistorialCompras() {
  const [ordenes, setOrdenes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const data = await ordenesService.obtenerHistorial();
      setOrdenes(data);
    } catch (error) {
          } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
  <h1 className="display text-3xl font-bold mb-8" style={{ color: '#283655' }}>
          Historial de Compras
        </h1>

        {isLoading ? (
          <div className="text-center py-8" style={{ color: '#283655' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                 style={{ borderColor: '#4D648D' }}></div>
            <p>Cargando historial...</p>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#283655' }}>
            <p className="text-[#4D648D] mb-4">No tienes compras registradas aún</p>
            <Button 
              onClick={() => window.location.href = '/'} 
              style={{ backgroundColor: '#283655', color: '#D0E1F9' }}
              className="hover:opacity-90"
            >
              Explorar Productos
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {ordenes.map((orden) => (
              <Card key={orden.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">Orden #{orden.id}</h3>
                      <p className="text-sm text-[#4D648D]">
                        {new Date(orden.fecha).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: '#283655' }}>
                        {formatPrice(orden.total)}
                      </p>
                      <p className="text-sm" style={{ color: '#4D648D' }}>
                        Estado: {orden.estado}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = `/orden/${orden.id}`}
                  >
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}