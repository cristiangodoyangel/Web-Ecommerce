import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Grid3X3, List, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductCard from '../components/ProductCard';
import API_BASE_URL from '../../config';

const Categorias = () => {
  const { categoriaNombre } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('nombre');
  const [viewMode, setViewMode] = useState('grid');
  const [totalProducts, setTotalProducts] = useState(0);

  // Mapeo de slugs del frontend a nombres de categorías del backend
  const categoryMapping = {
    'ella': 'Para Ella',
    'el': 'Para Él', 
    'parejas': 'Parejas',
    'cosmetica': 'Cosmética Erótica',
    'lenceria': 'Lencería',
    'accesorios': 'Accesorios',
    'linea-premium': 'Línea Premium'
  };

  // Obtener el nombre real de la categoría desde el slug
  const categoryName = categoryMapping[categoriaNombre] || categoriaNombre;

  useEffect(() => {
    fetchProductsByCategory();
  }, [categoryName, sortBy]);

  const fetchProductsByCategory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usar el nombre mapeado de la categoría para la consulta al backend
      let url = `${API_BASE_URL}/productos/?categorias__nombre=${encodeURIComponent(categoryName)}`;
      
      // Agregar ordenamiento
      if (sortBy === 'precio_asc') {
        url += '&ordering=precio';
      } else if (sortBy === 'precio_desc') {
        url += '&ordering=-precio';
      } else if (sortBy === 'nombre') {
        url += '&ordering=nombre';
      } else if (sortBy === 'fecha') {
        url += '&ordering=-creado';
      }

       // Para debugging

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
        setTotalProducts(data.length);
      } else {
        throw new Error(`Error ${response.status}: No se pudieron cargar los productos`);
      }
    } catch (error) {
            setError(error.message);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos de {categoryName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar productos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-700 text-white">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto xl:max-w-7xl px-4 py-8">
        {/* Header de la página */}
        <div className="mb-8">
          {/* Layout responsivo: vertical en móvil, horizontal en tablets (768x1024+) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#8c000f' }}>
                {categoryName}
              </h1>
              <p className="text-gray-600">
                {totalProducts === 0 
                  ? 'No hay productos disponibles en esta categoría' 
                  : `${totalProducts} ${totalProducts === 1 ? 'producto encontrado' : 'productos encontrados'}`
                }
              </p>
            </div>

            {/* Controles de vista y ordenamiento - Column en móvil, row en tablets 640px+ */}
            {productos.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Selector de ordenamiento */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" style={{ color: '#8c000f' }} />
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm"
                    style={{ borderColor: '#f83258', color: '#8c000f' }}
                  >
                    <option value="nombre">Nombre A-Z</option>
                    <option value="precio_asc">Precio: Menor a Mayor</option>
                    <option value="precio_desc">Precio: Mayor a Menor</option>
                    <option value="fecha">Más Recientes</option>
                  </select>
                </div>

                {/* Selector de vista */}
                <div className="inline-flex rounded-md border" style={{ borderColor: '#f83258' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm font-medium rounded-l-md border-r ${
                      viewMode === 'grid' 
                        ? 'text-white' 
                        : 'hover:bg-gray-50'
                    }`}
                    style={{ 
                      backgroundColor: viewMode === 'grid' ? '#8c000f' : 'transparent',
                      color: viewMode === 'grid' ? '#fff' : '#8c000f',
                      borderRightColor: '#f83258'
                    }}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                      viewMode === 'list' 
                        ? 'text-white' 
                        : 'hover:bg-gray-50'
                    }`}
                    style={{ 
                      backgroundColor: viewMode === 'list' ? '#8c000f' : 'transparent',
                      color: viewMode === 'list' ? '#fff' : '#8c000f'
                    }}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>         
        </div>

        {/* Contenido principal */}
        {productos.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No hay productos en esta categoría
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Lo sentimos, actualmente no tenemos productos disponibles en la categoría "{categoryName}".
              Te invitamos a explorar nuestras otras categorías.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="text-white px-8 py-3"
              style={{ backgroundColor: '#8c000f' }}
            >
              Explorar Todas las Categorías
            </Button>
          </div>
        ) : (
          // Grid responsivo - columna vertical hasta 1280px, luego grid normal
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 xl:grid-cols-4 gap-6'
              : 'grid grid-cols-1 xl:grid-cols-2 gap-6'
          }>
            {productos.map((producto) => (
              <ProductCard key={producto.id} product={producto} />
            ))}
          </div>
        )}
      </div>
      
      <Button
        variant="ghost"
        onClick={handleBackClick}
        className="mb-4 flex items-center gap-2"
        style={{ color: '#8c000f' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>
    </div>
  );
};

export default Categorias;