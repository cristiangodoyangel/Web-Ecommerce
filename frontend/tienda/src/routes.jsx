// src/routes.jsx
import { Route, Routes } from "react-router-dom";  // Quitar BrowserRouter as Router
import Inicio from "./assets/pages/Inicio";
import Productos from "./assets/pages/Productos";
import Carrito from "./assets/pages/Carrito";
import Checkout from "./assets/pages/Checkout";
import Categorias from "./assets/pages/Categorias";
import Login from "./assets/pages/Login";
import ProductoDetalle from "./assets/pages/ProductoDetalle";
import Deseados from "./assets/pages/Deseados";
import Registro from "./assets/pages/Registro";
import TodosProductos from "./assets/pages/TodosProductos";
import TodasOfertas from "./assets/pages/TodasOfertas";
import HistorialCompras from "./assets/pages/HistorialCompras";
import EstadoPago from "./assets/pages/EstadoPago"; 

const Rutas = () => (
  // Quitar <Router> y </Router> - solo dejar Routes
  <Routes>
    <Route path="/" element={<Inicio />} />
    <Route path="/productos" element={<Productos />} />
    <Route path="/TodosProductos" element={<TodosProductos />} />
    <Route path="/TodasOfertas" element={<TodasOfertas />} />
    <Route path="/producto/:id" element={<ProductoDetalle />} />
    <Route path="/carrito" element={<Carrito />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/categoria/:categoriaNombre" element={<Categorias />} />    
    <Route path="/login" element={<Login />} />
    <Route path="/deseados" element={<Deseados />} />
    <Route path="/registro" element={<Registro />} />
    <Route path="/historial-compras" element={<HistorialCompras />} />
    <Route path="/pago/procesar/:ordenId" element={<EstadoPago />} />
    <Route path="/pago/exitoso" element={<EstadoPago />} />
    <Route path="/pago/fallido" element={<EstadoPago />} />
    <Route path="/pago/pendiente" element={<EstadoPago />} />
  </Routes>
);

export default Rutas;