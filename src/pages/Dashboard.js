import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { LayoutDashboard, AlertCircle, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ 
    totalStock: 0, 
    bajoStock: [], 
    totalCostoInventario: 0,
    topSalidas: [],
    topValorStock: []
  });
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: productosData } = await supabase.from('productos').select('*');
      
      if (!productosData || productosData.length === 0) {
        setProductos([]);
        setStats({ totalStock: 0, bajoStock: [], totalCostoInventario: 0, topSalidas: [], topValorStock: [] });
        setLoading(false);
        return;
      }

      const { data: entradasData } = await supabase.from('entradas').select('producto_id, cantidad');
      const { data: salidasData } = await supabase.from('salidas').select('producto_id, cantidad');

      const entradasPorProducto = {};
      (entradasData || []).forEach(e => {
        entradasPorProducto[e.producto_id] = (entradasPorProducto[e.producto_id] || 0) + e.cantidad;
      });

      const salidasPorProducto = {};
      (salidasData || []).forEach(s => {
        salidasPorProducto[s.producto_id] = (salidasPorProducto[s.producto_id] || 0) + s.cantidad;
      });

      const productosConStock = productosData.map(p => ({
        ...p,
        stock: Math.max(0, (entradasPorProducto[p.id] || 0) - (salidasPorProducto[p.id] || 0)), // No negativo
        salidasTotal: salidasPorProducto[p.id] || 0,
        valorStock: Math.max(0, ((entradasPorProducto[p.id] || 0) - (salidasPorProducto[p.id] || 0)) * (p.precio_venta || 0)),
        costoStock: Math.max(0, ((entradasPorProducto[p.id] || 0) - (salidasPorProducto[p.id] || 0)) * (p.costo || 0)),
      }));

      setProductos(productosConStock);

      // Stats simples
      const totalStock = productosConStock.reduce((sum, p) => sum + p.stock, 0);
      const bajoStock = productosConStock.filter(p => p.stock <= 2 && p.stock > 0);
      const totalCostoInventario = productosConStock.reduce((sum, p) => sum + p.costoStock, 0);

      // Top 5 salidas (más salidas)
      const topSalidas = [...productosConStock]
        .sort((a, b) => b.salidasTotal - a.salidasTotal)
        .slice(0, 5);

      // Top 5 mayor valor en stock
      const topValorStock = [...productosConStock]
        .sort((a, b) => b.valorStock - a.valorStock)
        .slice(0, 5);

      setStats({ totalStock, bajoStock, totalCostoInventario, topSalidas, topValorStock });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setProductos([]);
      setStats({ totalStock: 0, bajoStock: [], totalCostoInventario: 0, topSalidas: [], topValorStock: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Inventario</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors text-sm"
          >
            <span>🔄</span> Actualizar
          </button>
        </div>

        {/* Cards de stats esenciales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-700">Total Stock</h2>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.totalStock} unidades</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-700">Alerta Bajo Stock</h2>
            </div>
            <p className={`text-3xl font-bold ${stats.bajoStock.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.bajoStock.length} productos
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-700">Costo Total Inventario</h2>
            </div>
            <p className="text-3xl font-bold text-blue-600">${stats.totalCostoInventario.toFixed(2)}</p>
          </div>
        </div>

        {/* Top 5 Productos con Más Salidas */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            Top 5 Productos con Más Salidas
          </h2>
          {stats.topSalidas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salidas Totales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topSalidas.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-bold">{p.salidasTotal}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${p.stock <= 2 ? 'text-red-600' : 'text-green-600'}`}>
                        {p.stock} unidades
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Sin salidas aún. ¡Agrega salidas para ver el top!</p>
          )}
        </div>

        {/* Productos con Stock Bajo */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Productos con Stock Bajo (&le; 2 unidades)
          </h2>
          {stats.bajoStock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Unitario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.bajoStock.map((p) => (
                    <tr key={p.id} className="bg-red-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">{p.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.costo?.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-medium">${p.costoStock.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-green-600 text-center py-8 font-medium">¡Excelente! Todos los productos tienen stock suficiente.</p>
          )}
        </div>

        {/* Productos con Mayor Valor en Stock */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Productos con Mayor Valor en Stock (Top 5)
          </h2>
          {stats.topValorStock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topValorStock.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{p.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.precio_venta?.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-bold">${p.valorStock.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Sin valor en stock aún. ¡Agrega productos y movimientos para ver el ranking!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;