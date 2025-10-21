import React from "react";
import { useNavigate } from "react-router-dom";

// Importar las imágenes directamente para asegurar la ruta correcta
import ellaImg from "../img/ella.png";
import elImg from "../img/el.png";
import bothImg from "../img/both.png";
import cosmImg from "../img/cosm.png";
import dessImg from "../img/dress.png";
import acceImg from "../img/acce.png";

// Añadir identificadores únicos (id) a las categorías y slug para la URL
const categories = [
  { id: 1, img: ellaImg, alt: "Para Ella", slug: "ella" },
  { id: 2, img: elImg, alt: "Para Él", slug: "el" },
  { id: 3, img: bothImg, alt: "Para Parejas", slug: "parejas" },
  { id: 4, img: cosmImg, alt: "Cosmética Erótica", slug: "cosmetica" },
  { id: 5, img: dessImg, alt: "Lencería", slug: "lenceria" },
  { id: 6, img: acceImg, alt: "Accesorios", slug: "accesorios" },
  { id: 7, img: cosmImg, alt: "Línea Premium", slug: "linea-premium" }, // Usando cosmImg temporalmente
];

const Categories = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categorySlug) => {
    navigate(`/categoria/${categorySlug}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Grid responsive optimizado - Cards más anchas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 xl:gap-8">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex flex-col items-center justify-center rounded-xl shadow-sm transition-all duration-300 cursor-pointer p-4 sm:p-5 md:p-6 xl:p-8 hover:shadow-lg hover:scale-105"
            style={{
              background: "#ffe7f2ff", // Terciario
              boxShadow: "0 2px 8px 0 rgba(248,50,88,0.10)" // Sombra rosa suave
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 15px 0 rgba(248,50,88,0.25)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 8px 0 rgba(248,50,88,0.10)"}
            onClick={() => handleCategoryClick(cat.slug)}
          >
            <img
              src={cat.img}
              alt={cat.alt}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 xl:w-20 xl:h-20 object-cover rounded-full mb-3 md:mb-4"
            />
            <h3
              className="text-xs sm:text-sm md:text-base xl:text-lg font-semibold text-center leading-tight"
              style={{ color: "#8c000f" }}
            >
              {cat.alt}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;