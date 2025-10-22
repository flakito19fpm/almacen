import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, User } from 'lucide-react';
import { useToast } from './ToastNotification';
import SearchBar from './SearchBar';
import { supabase, insertRecord, fetchTable, fetchExitsWithJoins, calculateStockForProduct } from '../utils/supabase';

const Exits = () => {
  const [exits, setExits] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredExits, setFilteredExits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ producto_id: '', fecha: new Date().toISOString().split('T')[0], cantidad: '', receptor: '', departamento: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allExits = await fetchExitsWithJoins();
      const allProducts = await fetchTable('productos');
      setExits(allExits);
      setProducts(allProducts);
      setFilteredExits(allExits);
    } catch (error) {
      addToast(`Error loading data: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    const filtered = exits.filter(exit => {
      return (
        (exit.productName && exit.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        exit.fecha.includes(searchTerm) ||
        (exit.receptor && exit.receptor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exit.departamento && exit.departamento.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    setFilteredExits(filtered);
  }, [searchTerm, exits]);

  const handleProductChange = (e) => {
    const prodId = e.target.value;
    setFormData({ ...formData, producto_id: prodId });
    const prod = products.find(p => p.id === prodId);
    setSelectedProduct(prod);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cantidad = parseInt(formData.cantidad);
    if (!cantidad || !formData.producto_id || !formData.receptor || !formData.departamento) {
      addToast('Todos los campos son requeridos', 'error');
      return;
    }

    try {
      const stock = await calculateStockForProduct(formData.producto_id);
      if (stock < cantidad) {
        addToast('Stock insuficiente', 'error');
        return;
      }

      const newExit = {
        ...formData,
        cantidad
      };
      await insertRecord('salidas', newExit);
      addToast('Salida registrada con éxito');
      setFormData({ producto_id: '', fecha: new Date().toISOString().split('T')[0], cantidad: '', receptor: '', departamento: '' });
      setSelectedProduct(null);
      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      addToast(`Error registering exit: ${error.message}`, 'error');
    }
  };

  return (
    <motion.div
      className="ml-64 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Salidas</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nueva Salida
        </button>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar salidas por producto, fecha, receptor o departamento..."
      />

      {isFormOpen && (
        <motion.div
          className="bg-white p-6 rounded-lg shadow-md mb-6"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Producto *</label>
              <select
                value={formData.producto_id}
                onChange={handleProductChange}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="">Seleccionar Producto</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.clave} - {p.nombre}</option>)}
              </select>
              {selectedProduct && (
                <p className="text-sm text-gray-600 mt-1">Nombre: {selectedProduct.nombre}</p>
              )}
            </div>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="number"
              placeholder="Cantidad *"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              className="p-3 border rounded-lg"
              required
              min="1"
            />
            <input
              type="text"
              placeholder="Nombre de la Persona *"
              value={formData.receptor}
              onChange={(e) => setFormData({ ...formData, receptor: e.target.value })}
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Departamento *"
              value={formData.departamento}
              onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
              className="p-3 border rounded-lg"
              required
            />
            <button type="submit" className="md:col-span-2 bg-green-600 text-white py-3 rounded-lg">
              Registrar Salida
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExits.map((exit) => (
          <motion.div
            key={exit.id}
            className="bg-white p-6 rounded-lg shadow-md"
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="font-bold">{exit.productName}</h3>
            <p>Clave: {exit.clave}</p>
            <p>Fecha: {exit.fecha}</p>
            <p>Cantidad: {exit.cantidad}</p>
            <p>Receptor: {exit.receptor}</p>
            <p>Departamento: {exit.departamento}</p>
            <p>Total Venta: {formatCurrency(exit.totalVenta)}</p>
          </motion.div>
        ))}
        {filteredExits.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-8">No se encontraron salidas con ese término.</p>
        )}
      </div>
    </motion.div>
  );
};

export default Exits;