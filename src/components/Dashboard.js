import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Package, DollarSign, TrendingUp, Users } from 'lucide-react';
import { fetchTable, calculateStockForProduct, getLowStockProducts, getTopMovedProducts, getTopValuedProducts } from '../utils/supabase';
import SearchBar from './SearchBar'; // Opcional para dashboard si quieres

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [exits, setExits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topMoved, setTopMoved] = useState([]);
  const [topValued, setTopValued] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [allProducts, allSuppliers, allEntries, allExits, lowStockData, topMovedData, topValuedData] = await Promise.all([
        fetchTable('productos'),
        fetchTable('proveedores'),
        fetchTable('entradas'),
        fetchTable('salidas'),
        getLowStockProducts(),
        getTopMovedProducts(allProducts, allEntries, allExits), // Adaptar si es necesario
        getTopValuedProducts(allProducts, allEntries, allExits)
      ]);
      setProducts(allProducts);
      setSuppliers(allSuppliers);
      setEntries(allEntries);
      setExits(allExits);
      setLowStock(lowStockData);
      setTopMoved(topMovedData);
      setTopValued(topValuedData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const totalValue = products.reduce((total, p) => total + (stocks[p.id] || 0) * (p.costo || 0), 0); // Definir stocks si necesario

  const mostMoved = topMoved[0];

  // Función formatCurrency
  const formatCurrency = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  return (
    <motion.div
      className="ml-64 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Inventario</h2>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <motion.div
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
            <div>
              <p className="font-semibold">¡Alerta de Stock Bajo!</p>
              <p className="text-sm">Productos en bajo stock: {lowStock.map(p => p.nombre).join(', ')}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div className="bg-white p-6 rounded-lg shadow-md" whileHover={{ scale: 1.05 }}>
          <Package className="w-8 h-8 text-blue-500 mb-2 mx-auto" />
          <h3 className="font-bold text-center mb-2">Productos Totales</h3>
          <p className="text-2xl font-bold text-center text-gray-900">{products.length}</p>
        </motion.div>
        <motion.div className="bg-white p-6 rounded-lg shadow-md" whileHover={{ scale: 1.05 }}>
          <DollarSign className="w-8 h-8 text-green-500 mb-2 mx-auto" />
          <h3 className="font-bold text-center mb-2">Valor Inventario</h3>
          <p className="text-2xl font-bold text-center text-gray-900">{formatCurrency(totalValue)}</p>
        </motion.div>
        {mostMoved && (
          <motion.div className="bg-white p-6 rounded-lg shadow-md" whileHover={{ scale: 1.05 }}>
            <TrendingUp className="w-8 h-8 text-purple-500 mb-2 mx-auto" />
            <h3 className="font-bold text-center mb-2">Producto Más Movido</h3>
            <p className="text-xl font-bold text-center text-gray-900">{mostMoved.nombre}</p>
            <p className="text-sm text-gray-600 text-center">Movimientos: {mostMoved.totalSalidas}</p>
          </motion.div>
        )}
        <motion.div className="bg-white p-6 rounded-lg shadow-md" whileHover={{ scale: 1.05 }}>
          <Users className="w-8 h-8 text-indigo-500 mb-2 mx-auto" />
          <h3 className="font-bold text-center mb-2">Proveedores</h3>
          <p className="text-2xl font-bold text-center text-gray-900">{suppliers.length}</p>
        </motion.div>
      </div>

      {/* Top 5 Moved Products */}
      <motion.div className="bg-white rounded-lg shadow-md mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-bold text-gray-800">Top 5 Productos Más Movidos</h3>
          </div>
        </div>
        <div className="p-6">
          {topMoved.length > 0 ? (
            <ul className="space-y-3">
              {topMoved.map((product, index) => (
                <li key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{product.nombre}</span>
                  </div>
                  <span className="font-bold text-purple-600">{product.totalSalidas} salidas</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay movimientos aún. ¡Empieza a registrar!</p>
          )}
        </div>
      </motion.div>

      {/* Top 5 Valued Products */}
      <motion.div className="bg-white rounded-lg shadow-md mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h3 className="text-xl font-bold text-gray-800">Top 5 Productos con Más Valor en Inventario</h3>
          </div>
        </div>
        <div className="p-6">
          {topValued.length > 0 ? (
            <ul className="space-y-3">
              {topValued.map((product, index) => (
                <li key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900 block">{product.nombre}</span>
                      <span className="text-sm text-gray-500">Stock: {stocks[product.id] || 0}</span>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">${product.valorTotal.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay productos con valor aún. ¡Agrega algunos!</p>
          )}
        </div>
      </motion.div>

      {/* Resumen y alertas igual como antes */}
    </motion.div>
  );
};

export default Dashboard;