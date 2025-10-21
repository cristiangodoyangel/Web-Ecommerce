import React from "react";
import Rutas from "./routes"; 
import { BrowserRouter as Router } from "react-router-dom";  

import './index.css'; 
import './App.css'; 
import { Header } from "./assets/components/Header";
import { Footer } from "./assets/components/Footer"; 
import { CarritoProvider } from './context/CarritoContext';
import { DeseosProvider } from './context/DeseosContext';

function App() {
  return (
    <CarritoProvider>
      <DeseosProvider>
        <Router>
          <Header />  {/* Aquí importamos y usamos el Header */}
          <Rutas />
          <Footer />
        </Router>
      </DeseosProvider>
    </CarritoProvider>
  );
}

export default App;

