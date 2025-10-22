import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Package, DollarSign } from 'lucide-react';
import { fetchTable, calculateStockForProduct, getLowStockProducts } from '../utils/supabase';
import SearchBar from './SearchBar';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [exits, setExits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stocks, setStocks] = useState({}); // Cache for stocks
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allProducts, allSuppliers, lowStock] = await Promise.all([
        fetchTable('productos'),
        fetchTable('proveedores'),
        getLowStockProducts()
      ]);
      setProducts(allProducts);
      setSuppliers(allSuppliers);
      setFilteredProducts(allProducts);
      setLowStockProducts(lowStock);
      // Precalculate stocks
      const stockCache = {};
      for (const product of allProducts) {
        stockCache[product.id] = lowStock.find(ls => ls.id === product.id)?.calculatedStock || 0;
      }
      setStocks(stockCache);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowerSearch = searchTerm.toLowerCase().trim();
      const filtered = products.filter(product =>
        product.nombre.toLowerCase().includes(lowerSearch) ||
        product.clave.toLowerCase().includes(lowerSearch)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const getTotalValue = () => {
    return products.reduce((total, p) => total + (stocks[p.id] || 0) * (p.costo || 0), 0);
  };

  return (
    <motion.div
      className="ml-64 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Inventario Completo</h2>
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-800">{lowStockProducts.length} productos en alerta</span>
          </div>
        )}
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar productos por nombre o clave..."
      />

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left font-semibold text-gray-700">Producto</th>
              <th className="p-4 text-left font-semibold text-gray-700">Clave</th>
              <th className="p-4 text-left font-semibold text-gray-700">Proveedor</th>
              <th className="p-4 text-left font-semibold text-gray-700">Stock Actual</th>
              <th className="p-4 text-left font-semibold text-gray-700">Costo Unitario</th>
              <th className="p-4 text-left font-semibold text-gray-700">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const stock = stocks[product.id] || 0;
              const supplier = suppliers.find(s => s.id === product.proveedor_id);
              const totalValue = stock * (product.costo || 0);
              const isLowStock = stock <= 1;

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    isLowStock ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="p-4 font-medium text-gray-900">{product.nombre}</td>
                  <td className="p-4 text-gray-600">{product.clave}</td>
                  <td className="p-4 text-gray-600">{supplier ? supplier.nombre_comercial : 'N/A'}</td>
                  <td className={`p-4 font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {stock} {isLowStock && <AlertCircle className="w-4 h-4 inline ml-1 text-red-500" />}
                  </td>
                  <td className="p-4 text-gray-600">${(product.costo || 0).toFixed(2)}</td>
                  <td className="p-4 text-gray-900 font-medium">${totalValue.toFixed(2)}</td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  {searchTerm.trim() ? 'No se encontraron productos con ese término.' : 'No hay productos en el inventario aún.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="bg-white p-6 rounded-lg shadow-md" whileHover={{ scale: 1.05 }}>
          <Package className="w-8 h-8 text-blue-500 mb-2 mx-auto" />
          <h3 className="font-bold text-center mb-2">Productos Totales</h3>
          <p className="text-2xl font-bold text-center text-gray-900">{products.length}</p>
        </motion.div>

        <motion.div className="bg-white p-6 rounded-lg shadow-md" whileHover={{ scale: 1.05 }}>
          <DollarSign className="w-8 h-8 text-green-500 mb-2 mx-auto" />
          <h3 className="font-bold text-center mb-2">Valor Total Inventario</h3>
          <p className="text-2xl font-bold text-center text-gray-900">${getTotalValue().toFixed(2)}</p>
        </motion.div>

        <motion.div className={`p-6 rounded-lg shadow-md ${lowStockProducts.length > 0 ? 'bg-yellow-50' : 'bg-white'}`} whileHover={{ scale: 1.05 }}>
          <AlertCircle className={`w-8 h-8 mb-2 mx-auto ${lowStockProducts.length > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
          <h3 className="font-bold text-center mb-2">En Stock Bajo</h3>
          <p className="text-2xl font-bold text-center text-gray-900">{lowStockProducts.length}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Inventory;