import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { FileBarChart, Calendar, Filter } from 'lucide-react';

const Reportes = () => {
  const [reportes, setReportes] = useState({ totalEntradas: 0, totalSalidas: 0, valorStock: 0, gananciasEstimadas: 0 });
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    generarReportes();
  }, []);

  const generarReportes = async (filtroFecha = null) => {
    try {
      // Total entradas y salidas
      const { count: totalEntradas } = await supabase.from('entradas').select('*', { count: 'exact', head: true });
      const { count: totalSalidas } = await supabase.from('salidas').select('*', { count: 'exact', head: true });

      // Stock y valor (de dashboard lógica)
      const { data: productosData } = await supabase.from('productos').select('*');
      const { data: entradasData } = await supabase.from('entradas').select('producto_id, cantidad');
      const { data: salidasData } = await supabase.from('salidas').select('producto_id, cantidad');

      const entradasPorProducto = {};
      entradasData?.forEach(e => {
        entradasPorProducto[e.producto_id] = (entradasPorProducto[e.producto_id] || 0) + e.cantidad;
      });

      const salidasPorProducto = {};
      salidasData?.forEach(s => {
        salidasPorProducto[s.producto_id] = (salidasPorProducto[s.producto_id] || 0) + s.cantidad;
      });

      const productosConStock = productosData?.map(p => ({
        ...p,
        stock: (entradasPorProducto[p.id] || 0) - (salidasPorProducto[p.id] || 0),
      })) || [];

      const valorStock = productosConStock.reduce((sum, p) => sum + (p.stock * p.precio_venta || 0), 0);
      const gananciasEstimadas = productosConStock.reduce((sum, p) => sum + (p.stock * (p.precio_venta - p.costo || 0)), 0);

      setReportes({ totalEntradas: totalEntradas || 0, totalSalidas: totalSalidas || 0, valorStock, gananciasEstimadas });

      // Movimientos filtrados
      let query = supabase.from('entradas').select('*, productos(nombre)').order('fecha', { ascending: false });
      if (filtroFecha) {
        query = query.gte('fecha', fechaInicio).lte('fecha', fechaFin);
      }
      const { data: entradasFiltradas } = await query;
      setMovimientos(entradasFiltradas || []);
    } catch (error) {
      console.error('Error generando reportes:', error);
    }
  };

  const aplicarFiltro = () => {
    generarReportes(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileBarChart className="w-8 h-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Entradas</h2>
            <p className="text-3xl font-bold text-blue-600">{reportes.totalEntradas}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Salidas</h2>
            <p className="text-3xl font-bold text-orange-600">{reportes.totalSalidas}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Valor del Stock</h2>
            <p className="text-3xl font-bold text-green-600">${reportes.valorStock.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Ganancias Estimadas</h2>
            <p className="text-3xl font-bold text-purple-600">${reportes.gananciasEstimadas.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          />
          <span className="text-gray-600">a</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={aplicarFiltro}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimientos.map((mov) => (
                <tr key={mov.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mov.productos?.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(mov.fecha).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{mov.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reportes;