import React from "react";
import { useNavigate } from "react-router-dom";

// Importar las imágenes directamente para asegurar la ruta correcta
import elImg from "../img/el.png";
import ellaImg from "../img/ella.png";
import unisexImg from "../img/unisex.png";
import floralesImg from "../img/florales.png";
import citricosImg from "../img/citricos.png";
import amaderadosImg from "../img/amaderados.png";
import orientalImg from "../img/orientales.png";
import bgImg from "../img/cat.png";  


// Añadir identificadores únicos (id) a las categorías y slug para la URL
const categories = [
  { id: 1, img: elImg, alt: "El", slug: "el" },
  { id: 2, img: ellaImg, alt: "Ella", slug: "ella" },
  { id: 3, img: unisexImg, alt: "Unisex", slug: "unisex" },
  { id: 4, img: floralesImg, alt: "Florales", slug: "florales" },
  { id: 5, img: citricosImg, alt: "Citricos", slug: "citricos" },
  { id: 6, img: amaderadosImg, alt: "Amaderados", slug: "amaderados" },
  { id: 7, img: orientalImg, alt: "Oriental", slug: "oriental" },
];

const Categories = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categorySlug) => {
    navigate(`/categoria/${categorySlug}`);
  };

 return (
  <div className="container mx-auto px-2 py-4">
    {/* CAMBIO CLAVE: 
      - grid grid-cols-3: Fuerza 3 columnas en móvil (adiós cards gigantes).
      - gap-2: Espacio pequeño en móvil.
      - sm:flex: A partir de tablet (sm), cambia a Flexbox para centrar mejor los tamaños fijos.
    */}
    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 md:gap-6 xl:gap-8">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleCategoryClick(cat.slug)}
          // CAMBIO CLAVE EN CLASES:
          // - w-full: En móvil ocupa el 100% de su celda de grid (que es pequeña).
          // - sm:w-32: En tablet fija el ancho a 128px.
          // - aspect-square: Mantiene siempre la forma cuadrada.
          className="group relative flex flex-col items-center justify-center 
                     w-full sm:w-32 md:w-40 xl:w-48 
                     aspect-square rounded-xl 
                     p-1 sm:p-4
                     transition-all duration-300 
                     hover:scale-105 cursor-pointer
                     shadow-[0_2px_8px_0_#D0E1F9] 
                     hover:shadow-[0_15px_15px_0_#D0E1F9]"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="relative z-10 flex flex-col items-center w-full">
            <img
              src={cat.img}
              alt={cat.alt}
              // Ajuste de imagen responsiva
              className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 xl:w-20 xl:h-20 
                         object-cover rounded-full mb-1 sm:mb-4 
                         transition-transform duration-300 group-hover:-translate-y-1"
            />
            
            {/* Texto ajustado para móvil */}
            <h3 className="text-[10px] sm:text-sm md:text-base xl:text-lg font-semibold 
                           text-center leading-tight px-1 text-[#D0E1F9] w-full truncate">
              {cat.alt}
            </h3>
          </div>
        </button>
      ))}
    </div>
  </div>
);
};

export default Categories;