import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Grid3X3, List, Search, Tag, Clock, Flame } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import ProductCard from '../components/ProductCard';
import API_BASE_URL from '../../config';

const TodasOfertas = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('descuento_desc');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOfertas, setFilteredOfertas] = useState([]);

  useEffect(() => {
    const fetchOfertas = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/ofertas/`);
        if (response.ok) {
          const data = await response.json();
          
          // Transformar las ofertas para que funcionen con ProductCard
          const ofertasTransformadas = data.map(oferta => ({
            ...oferta.producto,
            precio_oferta: oferta.precio_con_descuento,
            precio_original: oferta.producto.precio,
            porcentaje_descuento: oferta.porcentaje_descuento,
            en_oferta: true,
            fecha_inicio: oferta.fecha_inicio,
            fecha_fin: oferta.fecha_fin,
            activo: oferta.activo
          }));
          
          setOfertas(ofertasTransformadas);
          setFilteredOfertas(ofertasTransformadas);
        } else {
          setError('Error al cargar las ofertas');
        }
      } catch (error) {
                setError('Error de conexión al cargar las ofertas');
      } finally {
        setLoading(false);
      }
    };

    fetchOfertas();
  }, []);

  // Filtrar ofertas por búsqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOfertas(ofertas);
    } else {
      const filtered = ofertas.filter(oferta =>
        oferta.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        oferta.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        oferta.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOfertas(filtered);
    }
  }, [searchQuery, ofertas]);

  // Ordenar ofertas
  const sortOfertas = (ofertas) => {
    return [...ofertas].sort((a, b) => {
      switch (sortBy) {
        case 'descuento_desc':
          return b.porcentaje_descuento - a.porcentaje_descuento;
        case 'descuento_asc':
          return a.porcentaje_descuento - b.porcentaje_descuento;
        case 'precio_oferta_asc':
          return a.precio_oferta - b.precio_oferta;
        case 'precio_oferta_desc':
          return b.precio_oferta - a.precio_oferta;
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'categoria':
          return a.categoria.localeCompare(b.categoria);
        case 'fecha_fin':
          return new Date(a.fecha_fin) - new Date(b.fecha_fin);
        default:
          return 0;
      }
    });
  };

  const handleBackClick = () => {
    window.history.back();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOfferEnding = (fechaFin) => {
    const now = new Date();
    const endDate = new Date(fechaFin);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const sortedOfertas = sortOfertas(filteredOfertas);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p style={{ color: '#D0E1F9' }}>Cargando ofertas especiales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1E1F26' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#D0E1F9' }}>Error al cargar ofertas</h2>
          <p className="mb-6" style={{ color: '#4D648D' }}>{error}</p>
          <Button onClick={() => window.location.href = '/'} style={{ backgroundColor: '#283655', color: '#D0E1F9' }}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header de la página */}
        <div className="mb-8">
          {/* Banner de ofertas */}
          <div
            className="rounded-xl p-8 mb-8 text-center text-white relative overflow-hidden mt-4"
            style={{
              background: "linear-gradient(135deg, #283655 0%, #4D648D 100%)",
            }}
          >
            <div className="absolute inset-0 bg-black/10 mt-4"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Flame className="h-8 w-8 text-blue-200 animate-pulse" />
                <h1 className="text-4xl font-bold" style={{ color: "#D0E1F9" }}>
                  ¡OFERTAS ESPECIALES!
                </h1>
                <Flame className="h-8 w-8 text-blue-200 animate-pulse" />
              </div>
              <p
                className="text-xl opacity-90 mb-4"
                style={{ color: "#D0E1F9" }}
              >
                Descuentos increíbles en productos seleccionados
              </p>
              <p
                className="text-xl opacity-90 mb-4"
                style={{ color: "#D0E1F9" }}
              >
                Solo por este mes
              </p>
            </div>
          </div>

          <div className="displayflex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Controles de vista y ordenamiento */}
            {sortedOfertas.length > 0 && (
              <div className="flex flex-col gap-3">
                {/* Selector de ordenamiento */}
                <div className="flex items-center gap-2">
                  <Filter
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "#4D648D" }}
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    style={{
                      borderColor: "#283655",
                      color: "#283655",
                      backgroundColor: "#D0E1F9",
                    }}
                  >
                    <option value="descuento_desc">Mayor Descuento</option>
                    <option value="descuento_asc">Menor Descuento</option>
                    <option value="precio_oferta_asc">
                      Precio: Menor a Mayor
                    </option>
                    <option value="precio_oferta_desc">
                      Precio: Mayor a Menor
                    </option>
                    <option value="nombre">Nombre A-Z</option>
                    <option value="categoria">Por Categoría</option>
                    <option value="fecha_fin">Por Vencimiento</option>
                  </select>
                </div>

                {/* Selector de vista */}
                <div className="flex justify-center">
                  <div
                    className="flex items-center border rounded-lg"
                    style={{ borderColor: "#283655" }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="px-4 py-2"
                      style={{
                        backgroundColor:
                          viewMode === "grid" ? "#283655" : "transparent",
                        color: viewMode === "grid" ? "#D0E1F9" : "#283655",
                      }}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="px-4 py-2"
                      style={{
                        backgroundColor:
                          viewMode === "list" ? "#283655" : "transparent",
                        color: viewMode === "list" ? "#D0E1F9" : "#283655",
                      }}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido de ofertas */}
        {sortedOfertas.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🏷️</div>
            <h2
              className="text-2xl font-semibold mb-4"
              style={{ color: "#D0E1F9" }}
            >
              {searchQuery
                ? `No se encontraron ofertas para "${searchQuery}"`
                : "No hay ofertas disponibles"}
            </h2>
            <p
              className="display mb-8 max-w-md mx-auto"
              style={{ color: "#4D648D" }}
            >
              {searchQuery
                ? "Intenta con otros términos de búsqueda o explora todas nuestras ofertas."
                : "Pronto tendremos ofertas especiales para ti. ¡Mantente atento!"}
            </p>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery("")}
                className="px-8 py-3 mr-4"
                style={{ backgroundColor: "#283655", color: "#D0E1F9" }}
              >
                Ver Todas las Ofertas
              </Button>
            )}
            <Button
              onClick={() => (window.location.href = "/")}
              className="px-8 py-3"
              style={{ backgroundColor: "#4D648D", color: "#D0E1F9" }}
            >
              Explorar Productos
            </Button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {sortedOfertas.map((oferta) =>
              viewMode === "grid" ? (
                <ProductCard key={oferta.id} product={oferta} />
              ) : (
                <Card
                  key={oferta.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      {/* Badge de descuento flotante */}
                      <div className="relative">
                        <img
                          src={oferta.imagen}
                          alt={oferta.nombre}
                          className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                          onClick={() =>
                            (window.location.href = `/producto/${oferta.id}`)
                          }
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwQzEyOC44NjcgMTUwIDE1MCAxMjguODY3IDE1MCAxMDBDMTUwIDcxLjEzMyAxMjguODY3IDUwIDEwMCA1MEM3MS4xMzMgNTAgNTAgNzEuMTMzIDUwIDEwMEM1MCAxMjguODY3IDcxLjEzMyAxNTAgMTAwIDE1MFoiIGZpbGw9IiNlMWU1ZTkiLz4KPC9zdmc+";
                          }}
                        />
                        <div
                          className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1"
                          style={{ backgroundColor: "#f83258" }}
                        >
                          <Tag className="h-3 w-3" />-
                          {oferta.porcentaje_descuento}%
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3
                              className="font-semibold text-lg mb-1 cursor-pointer hover:underline"
                              style={{ color: "#8c000f" }}
                              onClick={() =>
                                (window.location.href = `/producto/${oferta.id}`)
                              }
                            >
                              {oferta.nombre}
                            </h3>
                            <p className="text-sm" style={{ color: "#f83258" }}>
                              {oferta.categoria}
                            </p>
                          </div>

                          {isOfferEnding(oferta.fecha_fin) && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                              <Clock className="h-3 w-3" />
                              ¡Últimos días!
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {oferta.descripcion}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span
                                className="text-xl font-bold"
                                style={{ color: "#283655" }}
                              >
                                {formatPrice(oferta.precio_oferta)}
                              </span>
                              <span
                                className="text-sm line-through"
                                style={{ color: "#4D648D" }}
                              >
                                {formatPrice(oferta.precio_original)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                Ahorra:{" "}
                                {formatPrice(
                                  oferta.precio_original - oferta.precio_oferta
                                )}
                              </span>
                              <span>Hasta: {formatDate(oferta.fecha_fin)}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2"></div>
                            <Button
                              onClick={() =>
                                (window.location.href = `/producto/${oferta.id}`)
                              }
                              className="px-4 py-2 text-sm"
                              style={{
                                backgroundColor: "#283655",
                                color: "#D0E1F9",
                              }}
                            >
                              Ver Oferta
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </div>

      <div className="pb-12">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-4 flex items-center gap-2 px-4 py-2 ml-4 "
          style={{ color: "#D0E1F9", backgroundColor: "#283655" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
    </div>
  );
};

export default TodasOfertas;