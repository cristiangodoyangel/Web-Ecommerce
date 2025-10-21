import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

export default function Productos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Corregido: usar fetch en lugar de api.get (que no está definido)
        const response = await fetch('https://lifesexshop.cl/api/productos/');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
                  }
      } catch (error) {
              } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return <div>Cargando productos...</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 py-6">
      {products.length ? (
        products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      ) : (
        <div>No hay productos disponibles.</div>
      )}
    </div>
  );
}