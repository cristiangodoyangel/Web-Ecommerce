import Categories from "../components/Categories";
import ProductSlider from "../components/ProductSlider";
import AdvertisementBanner from "../components/AdversisementBanner";
import AdvertisementBanner2 from "../components/AdversisementBanner2";
import ProductCard from "../components/ProductCard";
import React, { useEffect, useState } from "react";
import { HeroSection } from "../components/HeroSection";
import API_BASE_URL from '../../config';

const Inicio = () => {
  const [products, setProducts] = useState([]);
  const [ofertas, setOfertas] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [loadingOfertas, setLoadingOfertas] = useState(true);

  useEffect(() => {
    // Cargar productos nuevos
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/productos/`);
        if (response.ok) {
          const data = await response.json();
          // Ordenar por fecha de creación (más nuevos primero)
          const sortedProducts = data.sort((a, b) => 
            new Date(b.creado) - new Date(a.creado)
          );
          setProducts(sortedProducts);
        } else {
                  }
      } catch (error) {
              } finally {
        setLoading(false);
      }
    };

    // Cargar ofertas activas
    const fetchOfertas = async () => {
      try {
  const response = await fetch(`${API_BASE_URL}/ofertas/`);
        if (response.ok) {
          const data = await response.json();
           // Para debug
             const ofertasTransformadas = data.map(oferta => ({
            ...oferta.producto,
            precio_oferta: oferta.precio_con_descuento,
            precio_original: oferta.producto.precio,
            porcentaje_descuento: oferta.porcentaje_descuento,
            en_oferta: true
          }));
          setOfertas(ofertasTransformadas);
        } else {
                  }
      } catch (error) {
              } finally {
        setLoadingOfertas(false);
      }
    };
    
    fetchProducts();
    fetchOfertas();
  }, []);

  return (
  <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* HeroSection sin restricción de ancho */}
      <div style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(44, 62, 80, 0.08)' }}>
        <HeroSection />
      </div>

      {/* Contenido principal con contenedor responsivo */}
      <div className="container mx-auto px-2 sm:px-4 md:px-8 lg:px-12">
        <div style={{ padding: '2rem 0', gap: '2rem', display: 'flex', flexDirection: 'column' }}>
          {/* Productos en oferta */}
          {loadingOfertas ? (
            <div className="text-center py-4" style={{ color: '#283655' }}>
              Cargando ofertas...
            </div>
          ) : ofertas.length > 0 ? (
            <div>
              <ProductSlider
                products={ofertas}
                title="Productos en Oferta"
                maxVisible={4}
                maxTotal={8}
              />
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: '#283655' }}>
              No hay ofertas disponibles en este momento.
            </div>
          )}

          {/* Banner publicitario - oculto en móvil */}
          <div className="hidden md:block my-6">
            <AdvertisementBanner />
          </div>

          {/* Nuevos productos con slider */}
          {loading ? (
            <div className="text-center py-8" style={{ color: '#' }}>
            Cargando productos...
            </div>
          ) : (
            <div>
              <ProductSlider 
                products={products}
                title="Nuevos productos"
                maxVisible={4}
                maxTotal={8}
              />
            </div>
          )}

          {/* Botón para ver todos los productos */}
          {products.length > 0 && (
            <div className="text-center py-0">
              <button
                onClick={() => window.location.href = '/TodosProductos'}
                className="w-full sm:w-auto px-8 py-4 rounded-lg font-medium text-white transition-colors hover:opacity-90 shadow-lg"
                style={{ backgroundColor: '#4D648D', color: '#ffffff', border: '2px solid #D0E1F9' }}
              >
                Ver todos los productos
              </button>
            </div>
          )}

          {/* Banner publicitario - oculto en móvil */}
          <div className="hidden md:block my-6">
            <AdvertisementBanner2/>
          </div>

          {/* Categorías */}
          <div style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(44, 62, 80, 0.08)', borderRadius: '1rem' }}>
            <section className="py-6 sm:py-8">
              <Categories />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inicio;