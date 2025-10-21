import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, ArrowLeft, CreditCard, Truck, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useCarrito } from '../../context/CarritoContext';
import ConfirmModal from '../components/ConfirmModal';

export default function Carrito() {
  const { 
    items, 
    resumen, 
    isLoading, 
    actualizarCantidad, 
    eliminarItem, 
    limpiarCarrito, 
    cargarCarrito 
  } = useCarrito();
  
  const [isUpdating, setIsUpdating] = useState({});
  const [isRemoving, setIsRemoving] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [metodoEntrega, setMetodoEntrega] = useState('delivery');

  useEffect(() => {
    cargarCarrito();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calcularCostoEnvio = () => {
    const totalProductos = resumen.total_precio || 0;
    const envioGratisDesbloqueado = totalProductos >= 50000;
    
    if (metodoEntrega === 'retiro') return 0;
    if (envioGratisDesbloqueado) return 0;
    return 3500;
  };

  const estaEnvioGratis = () => {
    const totalProductos = resumen.total_precio || 0;
    return totalProductos >= 50000 && metodoEntrega === 'delivery';
  };

  const calcularTotal = () => {
    return (resumen.total_precio || 0) + calcularCostoEnvio();
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await actualizarCantidad(itemId, newQuantity);
    } catch (error) {
          } finally {
      setIsUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    setIsRemoving(itemId);
    try {
      await eliminarItem(itemId);
    } catch (error) {
          } finally {
      setIsRemoving(null);
    }
  };

  const handleClearCart = async () => {
    setShowClearConfirm(true);
  };

  const confirmClearCart = async () => {
    setShowClearConfirm(false);
    setIsClearing(true);
    try {
      await limpiarCarrito();
    } catch (error) {
          } finally {
      setIsClearing(false);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    // Guardar el método de entrega en localStorage para el checkout
    localStorage.setItem('metodo_entrega', metodoEntrega);
    localStorage.setItem('costo_envio', calcularCostoEnvio().toString());
    // Redirigir a la página de checkout
    window.location.href = '/checkout';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleProductClick = (productId) => {
    window.location.href = `/producto/${productId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#f83258' }}></div>
          <p style={{ color: '#8c000f' }}>Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la página */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="flex items-center gap-2 self-start"
                style={{ color: '#8c000f' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Continuar Comprando</span>
                <span className="sm:hidden">Volver</span>
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#8c000f' }}>
                  Carrito de Compras
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
                </p>
              </div>
            </div>
            
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearCart}
                disabled={isClearing}
                className="flex items-center gap-2 w-full sm:w-auto padding-2 mb-4"
                style={{ borderColor: '#f83258', color: '#f83258' }}
              >
                {isClearing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 p-1" style={{ borderColor: '#f83258' }}></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="display hidden sm:inline">Vaciar Carrito</span>
                <span className="sm:hidden">Vaciar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="display max-w-7xl mx-auto px-4 py-6 sm:py-8 p-4">
        {items.length === 0 ? (
          // Carrito vacío
          <div className="flex flex-col items-center text-center py-12 sm:py-16 px-4">
            <ShoppingBag className="h-16 w-16 sm:h-24 sm:w-24 mb-6 text-gray-300" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-4" style={{ color: '#8c000f' }}>
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md text-sm sm:text-base">
              Agrega algunos productos a tu carrito para continuar con tu compra
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="px-6 sm:px-8 py-3 text-white font-medium rounded-lg w-full sm:w-auto"
              style={{ backgroundColor: '#f83258' }}
            >
              Explorar Productos
            </Button>
          </div>
        ) : (
          // Carrito con productos
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Layout móvil: todo en columna vertical */}
                    <div className="flex flex-col sm:hidden min-h-[400px]">
                      {/* Imagen del producto - Móvil */}
                      <div className="relative w-mid h-68 mb-3">
                        <img
                          src={item.producto.imagen}
                          alt={item.producto.nombre}
                          className="w-mid h-mid object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleProductClick(item.producto.id)}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwQzEyOC44NjcgMTUwIDE1MCAxMjguODY3IDE1MCAxMDBDMTUwIDcxLjEzMyAxMjguODY3IDUwIDEwMCA1MEM3MS4xMzMgNTAgNTAgNzEuMTMzIDUwIDEwMEM1MCAxMjguODY3IDcxLjEzMyAxNTAgMTAwIDE1MFoiIGZpbGw9IiNlMWU1ZTkiLz4KPC9zdmc+';
                          }}
                        />
                        {/* Botón eliminar - Móvil NUEVO */}
                        <div className="absolute top-3 right-3 z-30">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveItem(item.id);
                            }}
                            disabled={isRemoving === item.id}
                            className="w-16 h-16 hover:bg-red-700 text-[#8c000f] hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              minWidth: '74px',
                              minHeight: '74px'
                            }}
                          >
                            {isRemoving === item.id ? (
                              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Información del producto - Móvil vertical */}
                      <div className="p-3 space-y-3">
                        {/* Título */}
                        <h3 
                          className="font-semibold text-base leading-tight cursor-pointer hover:underline h-88 pt-4 sm:pt-0 pb-3 sm:pb-0"
                          style={{ 
                            color: '#8c000f',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.3',
                            maxHeight: '4.6em'
                          }}
                          onClick={() => handleProductClick(item.producto.id)}
                        >
                          {item.producto.nombre}
                        </h3>

                        {/* Precio unitario */}
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-gray-600">Precio unitario:</span>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <p className="text-sm font-bold" style={{ color: item.tiene_oferta ? '#f83258' : '#8c000f' }}>
                              {formatPrice(item.precio_unitario || item.producto.precio)}
                            </p>
                            {item.tiene_oferta && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs line-through text-gray-500">
                                  {formatPrice(item.producto.precio)}
                                </span>
                                <span className="text-xs bg-red-100 text-red-600 px-1 rounded">
                                  -{item.porcentaje_descuento}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                       
                        {/* Controles de cantidad */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-medium">Cantidad:</span>
                            <div className="flex items-center border-2 rounded-lg overflow-hidden bg-white shadow-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                                disabled={item.cantidad <= 1 || isUpdating[item.id]}
                                className="h-10 w-10 p-0 rounded-none hover:bg-gray-100 border-r-2 flex items-center justify-center text-gray-700 hover:text-black flex-shrink-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              
                              <div className="px-3 py-2 min-w-[50px] text-center text-sm font-bold bg-gray-50 flex-shrink-0">
                                {item.cantidad}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                                disabled={item.cantidad >= item.producto.stock || isUpdating[item.id]}
                                className="h-10 w-10 p-0 rounded-none hover:bg-gray-100 border-l-2 flex items-center justify-center text-gray-700 hover:text-black flex-shrink-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {isUpdating[item.id] && (
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#f83258' }}></div>
                            </div>
                          )}
                        </div>

                        {/* Subtotal */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Subtotal:</span>
                            <div className="flex flex-col items-end">
                              <p className="text-lg font-bold" style={{ color: '#8c000f' }}>
                                {formatPrice(item.subtotal || (item.precio_unitario || item.producto.precio) * item.cantidad)}
                              </p>
                              {item.tiene_oferta && (
                                <span className="text-xs text-green-600">
                                  Ahorras: {formatPrice((item.producto.precio - (item.precio_unitario || item.producto.precio)) * item.cantidad)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Layout desktop: horizontal */}
                    <div className="hidden sm:flex">
                      {/* Imagen del producto - Desktop */}
                      <div className="w-38 h-32 flex-shrink-0">
                        <img
                          src={item.producto.imagen}
                          alt={item.producto.nombre}
                          className="w-mid h-mid  object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleProductClick(item.producto.id)}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwQzEyOC44NjcgMTUwIDE1MCAxMjguODY3IDE1MCAxMDBDMTUwIDcxLjEzMyAxMjguODY3IDUwIDEwMCA1MEM3MS4xMzMgNTAgNTAgNzEuMTMzIDUwIDEwMEM1MCAxMjguODY3IDcxLjEzMyAxNTAgMTAwIDE1MFoiIGZpbGw9IiNlMWU1ZTkiLz4KPC9zdmc+';
                          }}
                        />
                      </div>

                      {/* Información del producto - Desktop */}
                      <div className="flex-1 p-4 space-y-3">
                        <div className="flex justify-between items-start mb-2">
                          <h3 
                            className="font-semibold text-lg cursor-pointer hover:underline line-clamp-2 flex-1 mr-2"
                            style={{ color: '#8c000f' }}
                            onClick={() => handleProductClick(item.producto.id)}
                          >
                            {item.producto.nombre}
                          </h3>
                          
                          {/* Botón eliminar - Desktop NUEVO */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveItem(item.id);
                            }}
                            disabled={isRemoving === item.id}
                            className="ml-3 p-3 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 border-2 border-red-200 hover:border-red-300"
                            title="Eliminar producto"
                            style={{
                              minWidth: '44px',
                              minHeight: '44px'
                            }}
                          >
                            {isRemoving === item.id ? (
                              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Precio unitario */}
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold" style={{ color: item.tiene_oferta ? '#f83258' : '#8c000f' }}>
                            {formatPrice(item.precio_unitario || item.producto.precio)}
                          </p>
                          {item.tiene_oferta && (
                            <>
                              <span className="text-sm line-through text-gray-500">
                                {formatPrice(item.producto.precio)}
                              </span>
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">
                                -{item.porcentaje_descuento}% OFF
                              </span>
                            </>
                          )}
                        </div>

                        

                        {/* Controles de cantidad - Desktop horizontal */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex items-center gap-3 justify-center lg:justify-start">
                            <span className="text-sm text-gray-600 font-medium">Cantidad:</span>
                            <div className="flex items-center border-2 rounded-lg overflow-hidden bg-white shadow-sm w-fit">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                                disabled={item.cantidad <= 1 || isUpdating[item.id]}
                                className="h-12 w-12 p-0 rounded-none hover:bg-gray-100 border-r-2 flex items-center justify-center text-gray-700 hover:text-black flex-shrink-0"
                              >
                                <Minus className="h-5 w-5" />
                              </Button>
                              
                              <div className="px-4 py-3 min-w-[70px] text-center text-base font-bold bg-gray-50 flex-shrink-0">
                                {item.cantidad}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                                disabled={item.cantidad >= item.producto.stock || isUpdating[item.id]}
                                className="h-12 w-12 p-0 rounded-none hover:bg-gray-100 border-l-2 flex items-center justify-center text-gray-700 hover:text-black flex-shrink-0"
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
                            </div>
                            
                            {isUpdating[item.id] && (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#f83258' }}></div>
                            )}
                          </div>

                          {/* Subtotal Desktop */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                            <p className="text-lg font-bold" style={{ color: '#8c000f' }}>
                              {formatPrice(item.subtotal || (item.precio_unitario || item.producto.precio) * item.cantidad)}
                            </p>
                            {item.tiene_oferta && (
                              <p className="text-xs text-green-600 mt-1">
                                Ahorras: {formatPrice((item.producto.precio - (item.precio_unitario || item.producto.precio)) * item.cantidad)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1 mt-6 lg:mt-0 mb-10 lg:mb-0">
              <Card className="sticky top-4">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: '#8c000f' }}>
                    Resumen del Pedido
                  </h3>

                  {/* Forma de Entrega */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold mb-3" style={{ color: '#8c000f' }}>
                      Forma de Entrega
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Delivery */}
                      <div 
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          metodoEntrega === 'delivery' 
                            ? 'border-pink-500 bg-pink-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setMetodoEntrega('delivery')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                checked={metodoEntrega === 'delivery'}
                                onChange={() => setMetodoEntrega('delivery')}
                                className="mr-2"
                              />
                              <Truck className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Delivery a Domicilio</p>
                              <p className="text-sm text-gray-600">Lunes a Viernes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {estaEnvioGratis() ? (
                              <>
                                <p className="font-bold text-green-600">¡GRATIS!</p>
                                <p className="text-xs text-green-600">Desbloqueado</p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-green-600">$3.500</p>
                                <p className="text-xs text-gray-500">CLP</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Retiro en tienda */}
                      <div 
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          metodoEntrega === 'retiro' 
                            ? 'border-pink-500 bg-pink-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setMetodoEntrega('retiro')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                checked={metodoEntrega === 'retiro'}
                                onChange={() => setMetodoEntrega('retiro')}
                                className="mr-2"
                              />
                              <Store className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Retiro en Tienda</p>
                              <p className="text-sm text-gray-600">Lunes a Sábado</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">Gratis</p>
                            <p className="text-xs text-gray-500">$0</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

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

                  <div className="space-y-3 mb-4 sm:mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm sm:text-base">Productos ({resumen.total_items}):</span>
                      <span className="font-medium text-sm sm:text-base">{formatPrice(resumen.total_precio)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Envío ({metodoEntrega === 'delivery' ? 'Delivery' : 'Retiro'}):
                      </span>
                      <span className="font-medium text-green-600 text-sm sm:text-base">
                        {calcularCostoEnvio() === 0 ? 'Gratis' : formatPrice(calcularCostoEnvio())}
                      </span>
                    </div>
                    
                    <hr className="my-4" />
                    
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span style={{ color: '#8c000f' }}>Total:</span>
                      <span style={{ color: '#8c000f' }}>{formatPrice(calcularTotal())}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full py-3 text-white font-medium rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                    style={{ backgroundColor: '#f83258' }}
                    disabled={items.length === 0}
                  >
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    Proceder al Pago
                  </Button>

                  <div className="text-xs text-gray-500 text-center mt-4 space-y-1">
                    <p>• Delivery disponible Lunes a Viernes ($3.500)</p>
                    <p>• Retiro en tienda Lunes a Sábado (Gratis)</p>
                    <p>• Los precios incluyen IVA</p>
                    <p>• Tiempo de entrega: 2-5 días hábiles</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearCart}
        title="Vaciar Carrito"
        message="¿Estás seguro de que quieres eliminar todos los productos del carrito? Esta acción no se puede deshacer."
        confirmText="Sí, vaciar carrito"
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
}