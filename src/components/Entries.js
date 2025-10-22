import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Package } from 'lucide-react';
import { useToast } from './ToastNotification';
import SearchBar from './SearchBar';
import { supabase, insertRecord, fetchTable, fetchEntriesWithJoins } from '../utils/supabase';

const Entries = () => {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ producto_id: '', fecha: new Date().toISOString().split('T')[0], cantidad: '', proveedor_id: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allEntries = await fetchEntriesWithJoins();
      const allProducts = await fetchTable('productos');
      const allSuppliers = await fetchTable('proveedores');
      setEntries(allEntries);
      setProducts(allProducts);
      setSuppliers(allSuppliers);
      setFilteredEntries(allEntries);
    } catch (error) {
      addToast(`Error loading data: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    const filtered = entries.filter(entry => {
      return (
        (entry.productName && entry.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        entry.fecha.includes(searchTerm) ||
        (entry.proveedorName && entry.proveedorName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    setFilteredEntries(filtered);
  }, [searchTerm, entries]);

  const handleProductChange = (e) => {
    const prodId = e.target.value;
    setFormData({ ...formData, producto_id: prodId });
    const prod = products.find(p => p.id === prodId);
    setSelectedProduct(prod);
    if (prod && !formData.proveedor_id) {
      setFormData({ ...formData, proveedor_id: prod.proveedor_id });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parseInt(formData.cantidad) || !formData.producto_id) {
      addToast('Producto y cantidad son requeridos', 'error');
      return;
    }

    try {
      const newEntry = {
        ...formData,
        cantidad: parseInt(formData.cantidad)
      };
      await insertRecord('entradas', newEntry);
      addToast('Entrada registrada con éxito');
      setFormData({ producto_id: '', fecha: new Date().toISOString().split('T')[0], cantidad: '', proveedor_id: '' });
      setSelectedProduct(null);
      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      addToast(`Error registering entry: ${error.message}`, 'error');
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
        <h2 className="text-3xl font-bold text-gray-800">Entradas</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nueva Entrada
        </button>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar entradas por producto, fecha o proveedor..."
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
                <p className="text-sm text-gray-600 mt-1">Nombre: {selectedProduct.nombre} | Costo: ${selectedProduct.costo}</p>
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
            <select
              value={formData.proveedor_id}
              onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value })}
              className="p-3 border rounded-lg"
              required
            >
              <option value="">Seleccionar Proveedor</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre_comercial}</option>)}
            </select>
            <button type="submit" className="md:col-span-2 bg-green-600 text-white py-3 rounded-lg">
              Registrar Entrada
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntries.map((entry) => (
          <motion.div
            key={entry.id}
            className="bg-white p-6 rounded-lg shadow-md"
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="font-bold">{entry.productName}</h3>
            <p>Clave: {entry.clave}</p>
            <p>Fecha: {entry.fecha}</p>
            <p>Cantidad: {entry.cantidad}</p>
            <p>Proveedor: {entry.proveedorName}</p>
            <p>Total Costo: {formatCurrency(entry.totalCosto)}</p>
          </motion.div>
        ))}
        {filteredEntries.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-8">No se encontraron entradas con ese término.</p>
        )}
      </div>
    </motion.div>
  );
};

export default Entries;