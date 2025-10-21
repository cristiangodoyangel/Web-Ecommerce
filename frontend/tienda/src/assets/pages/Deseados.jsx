import { useEffect, useState } from 'react';
import { useDeseos } from '../../context/DeseosContext.jsx';
import { useCarrito } from '../../context/CarritoContext.jsx';
import { Heart, ShoppingCart, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';

const Deseados = () => {
  const { items, resumen, isLoading, eliminarProducto, cargarDeseos } = useDeseos();
  const { agregarProducto } = useCarrito();
  const [processingItems, setProcessingItems] = useState(new Set());

  useEffect(() => {
    cargarDeseos();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleRemoveFromWishlist = async (deseosId) => {
    setProcessingItems(prev => new Set(prev).add(deseosId));
    try {
      const result = await eliminarProducto(deseosId);
      if (!result.success) {
              }
    } catch (error) {
          } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(deseosId);
        return newSet;
      });
    }
  };

const handleAddToCart = async (producto) => {
  setProcessingItems(prev => new Set(prev).add(`cart-${producto.id}`));
  try {
    const result = await agregarProducto(producto.id, 1); // Funciona para ambos
    if (result.success) {
          } else {
            if (result.error?.detail) {
        alert(result.error.detail);
      }
    }
  } catch (error) {
      } finally {
    setProcessingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(`cart-${producto.id}`);
      return newSet;
    });
  }
};

  const handleProductClick = (productoId) => {
    window.location.href = `/producto/${productoId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu lista de deseos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 fill-current flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Lista de Deseos</h1>
          </div>
          <p className="text-red-600 text-sm sm:text-base">
            {resumen.total_items === 0 
              ? 'Tu lista de deseos está vacía' 
              : `Tienes ${resumen.total_items} ${resumen.total_items === 1 ? 'producto' : 'productos'} en tu lista de deseos`
            }
          </p>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <Heart className="h-16 w-16 sm:h-24 sm:w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Tu lista de deseos está vacía
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
              Explora nuestros productos y agrega tus favoritos a tu lista de deseos 
              para comprarlos más tarde.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 rounded-lg w-full sm:w-auto"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Explorar Productos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => {
              const producto = item.producto;
              const hasStock = producto.stock && producto.stock > 0;
              const isActive = producto.activo !== false;
              const isRemoving = processingItems.has(item.id);
              const isAddingToCart = processingItems.has(`cart-${producto.id}`);

              return (
                <Card key={item.id} className="group relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative h-48 sm:h-64 overflow-hidden cursor-pointer" onClick={() => handleProductClick(producto.id)}>
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwQzEyOC44NjcgMTUwIDE1MCAxMjguODY3IDE1MCAxMDBDMTUwIDcxLjEzMyAxMjguODY3IDUwIDEwMCA1MEM3MS4xMzMgNTAgNTAgNzEuMTMzIDUwIDEwMEM1MCAxMjguODY3IDcxLjEzMyAxNTAgMTAwIDE1MFoiIGZpbGw9IiNlMWU1ZTkiLz4KPC9zdmc+';
                        }}
                      />
                      {/* Remove button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white border border-red-200 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromWishlist(item.id);
                        }}
                        disabled={isRemoving}
                        style={{ opacity: isRemoving ? 0.6 : 1 }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>

                    {/* Product Info */}
                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      {/* Category */}
                      <div className="text-xs font-medium uppercase tracking-wide text-red-800">
                        {producto.categoria}
                      </div>

                      {/* Title */}
                      <h3 
                        className="font-semibold text-gray-900 hover:text-red-600 transition-colors line-clamp-2 cursor-pointer text-sm sm:text-base"
                        onClick={() => handleProductClick(producto.id)}
                      >
                        {producto.nombre}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {producto.descripcion}
                      </p>

                      {/* Stock info */}
                      <div className="text-xs text-right">
                        <span className={hasStock ? 'text-green-600' : 'text-red-600'}>
                          {hasStock ? `Disponible` : 'Sin stock'}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="text-left">
                        <span className="text-lg sm:text-xl font-bold text-gray-900 block">
                          {formatPrice(producto.precio)}
                        </span>
                        {producto.originalPrice && producto.originalPrice > producto.precio && (
                          <span className="text-sm line-through text-gray-500 block">
                            {formatPrice(producto.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm py-2"
                          onClick={() => handleAddToCart(producto)}
                          disabled={!hasStock || !isActive || isAddingToCart}
                          style={{ opacity: isAddingToCart ? 0.6 : 1 }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">
                            {isAddingToCart 
                              ? 'Agregando...' 
                              : hasStock && isActive 
                                ? 'Agregar al Carrito' 
                                : 'Agotado'
                            }
                          </span>
                          <span className="sm:hidden">
                            {isAddingToCart 
                              ? '...' 
                              : hasStock && isActive 
                                ? 'Agregar' 
                                : 'Agotado'
                            }
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        {items.length > 0 && (
          <div className="mt-8 sm:mt-12 bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total de productos en lista de deseos
                </h3>
                <p className="text-gray-600">
                  {resumen.total_items} {resumen.total_items === 1 ? 'producto' : 'productos'}
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 w-full sm:w-auto"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Seguir Comprando
              </Button>
            </div>
          </div>
        )}
      </div> 
    </div>
  );
};

export default Deseados;