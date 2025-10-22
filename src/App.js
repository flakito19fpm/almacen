import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Proveedores from './pages/Proveedores';
import Productos from './pages/Productos';
import Entradas from './pages/Entradas';
import Salidas from './pages/Salidas';
import Reportes from './pages/Reportes';
import ToastContainer from './components/ToastContainer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/entradas" element={<Entradas />} />
          <Route path="/salidas" element={<Salidas />} />
          <Route path="/reportes" element={<Reportes />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;