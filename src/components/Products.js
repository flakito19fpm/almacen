import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash } from 'lucide-react';
import { useToast } from './ToastNotification';
import SearchBar from './SearchBar';
import { supabase, fetchTable, insertRecord, updateRecord, deleteRecord, calculateStockForProduct } from '../utils/supabase';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ clave: '', proveedor_id: '', nombre: '', costo: '', tiempo_vida: '', precio_venta: '' });
  const [stocks, setStocks] = useState({}); // Cache para stocks
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allProducts, allSuppliers] = await Promise.all([
        fetchTable('productos'),
        fetchTable('proveedores')
      ]);
      setProducts(allProducts);
      setSuppliers(allSuppliers);
      setFilteredProducts(allProducts);

      // Precalcular stocks para todos los productos
      const stockCache = {};
      for (const product of allProducts) {
        try {
          stockCache[product.id] = await calculateStockForProduct(product.id);
        } catch (error) {
          stockCache[product.id] = 0;
        }
      }
      setStocks(stockCache);
    } catch (error) {
      addToast(`Error loading data: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    const filtered = products.filter(product =>
      product.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.tiempo_vida && product.tiempo_vida.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clave || !formData.nombre || !formData.proveedor_id || !formData.costo || !formData.precio_venta) {
      addToast('Todos los campos requeridos deben llenarse', 'error');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        costo: parseFloat(formData.costo),
        precio_venta: parseFloat(formData.precio_venta)
      };

      let updatedProduct;
      if (editingId) {
        updatedProduct = await updateRecord('productos', editingId, dataToSave);
        addToast('Producto actualizado con éxito');
      } else {
        updatedProduct = await insertRecord('productos', dataToSave);
        addToast('Producto agregado con éxito');
      }

      await loadData();
      setFormData({ clave: '', proveedor_id: '', nombre: '', costo: '', tiempo_vida: '', precio_venta: '' });
      setIsFormOpen(false);
      setEditingId(null);
    } catch (error) {
      addToast(`Error saving product: ${error.message}`, 'error');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      clave: product.clave,
      proveedor_id: product.proveedor_id,
      nombre: product.nombre,
      costo: product.costo,
      tiempo_vida: product.tiempo_vida,
      precio_venta: product.precio_venta
    });
    setEditingId(product.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteRecord('productos', id);
      addToast('Producto eliminado con éxito');
      await loadData();
    } catch (error) {
      addToast(`Error deleting product: ${error.message}`, 'error');
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
        <h2 className="text-3xl font-bold text-gray-800">Productos</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar productos por clave, nombre o tiempo de vida..."
      />

      {isFormOpen && (
        <motion.div
          className="bg-white p-6 rounded-lg shadow-md mb-6"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Clave del Producto *"
              value={formData.clave}
              onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
              className="p-3 border rounded-lg"
              required
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
            <input
              type="text"
              placeholder="Nombre del Producto *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="p-3 border rounded-lg md:col-span-2"
              required
            />
            <input
              type="number"
              placeholder="Costo *"
              value={formData.costo}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              className="p-3 border rounded-lg"
              required
              step="0.01"
            />
            <input
              type="text"
              placeholder="Tiempo de Vida (ej. 6 meses)"
              value={formData.tiempo_vida}
              onChange={(e) => setFormData({ ...formData, tiempo_vida: e.target.value })}
              className="p-3 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Precio de Venta *"
              value={formData.precio_venta}
              onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
              className="p-3 border rounded-lg"
              required
              step="0.01"
            />
            <button type="submit" className="md:col-span-2 bg-green-600 text-white py-3 rounded-lg">
              {editingId ? 'Actualizar' : 'Guardar'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const stock = stocks[product.id] || 0;
          const supplier = suppliers.find(s => s.id === product.proveedor_id);
          return (
            <motion.div
              key={product.id}
              className="bg-white p-6 rounded-lg shadow-md"
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="font-bold text-lg">{product.nombre}</h3>
              <p className="text-gray-600">Clave: {product.clave}</p>
              <p>Proveedor: {supplier ? supplier.nombre_comercial : 'N/A'}</p>
              <p>Costo: ${product.costo}</p>
              <p>Tiempo Vida: {product.tiempo_vida || 'N/A'}</p>
              <p>Precio Venta: ${product.precio_venta}</p>
              <p className={stock <= 1 ? 'text-red-600 font-bold' : ''}>Stock: {stock}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleEdit(product)} className="text-blue-600 hover:underline">
                  <Edit className="w-4 h-4 inline mr-1" /> Editar
                </button>
                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">
                  <Trash className="w-4 h-4 inline mr-1" /> Eliminar
                </button>
              </div>
            </motion.div>
          );
        })}
        {filteredProducts.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-8">No se encontraron productos con ese término.</p>
        )}
      </div>
    </motion.div>
  );
};

export default Products;