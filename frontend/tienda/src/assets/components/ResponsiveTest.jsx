import React from 'react';

const ResponsiveTest = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 text-principal">
        🎯 Test Responsive Life Sex Shop
      </h1>
      
      {/* Grid de prueba */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 mb-8">
        {[1,2,3,4,5,6,7].map(num => (
          <div 
            key={num}
            className="bg-terciario p-4 rounded-lg text-center text-principal font-semibold"
          >
            Item {num}
          </div>
        ))}
      </div>

      {/* Indicadores de breakpoint */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Breakpoint Actual:</h2>
        <div className="space-y-2">
          <div className="block xs:hidden text-red-600 font-bold">📱 Móvil Pequeño (&lt; 475px)</div>
          <div className="hidden xs:block sm:hidden text-orange-600 font-bold">📱 Móvil Grande (475px - 640px)</div>
          <div className="hidden sm:block md:hidden text-yellow-600 font-bold">📱 Móvil XL (640px - 768px)</div>
          <div className="hidden md:block lg:hidden text-green-600 font-bold">📟 Tablet (768px - 1024px)</div>
          <div className="hidden lg:block xl:hidden text-blue-600 font-bold">💻 Laptop (1024px - 1280px)</div>
          <div className="hidden xl:block 2xl:hidden text-purple-600 font-bold">🖥️ Desktop (1280px - 1536px)</div>
          <div className="hidden 2xl:block text-pink-600 font-bold">🖥️ Desktop XL (&gt; 1536px)</div>
        </div>
      </div>

      {/* Cards responsive */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-2">📱 Móvil</h3>
          <p className="text-gray-600">1 columna, stack vertical</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-2">📟 Tablet</h3>
          <p className="text-gray-600">2 columnas, mejor uso del espacio</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-2">💻 Desktop</h3>
          <p className="text-gray-600">3+ columnas, máximo contenido</p>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTest;