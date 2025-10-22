import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, TrendingUp, Download } from 'lucide-react';
import { getEntriesByPeriod, getExitsByPeriod, getSalesReport, getInventoryReport, fetchTable } from '../utils/supabase';
import { formatCurrency } from '../utils/helpers';

const DollarSignIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v0m0 0h2.546c.75 0 1.454-.402 1.83-1.071M6 8V7m3.999-1a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [view, setView] = useState('resumen');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState({ 
    entries: [], 
    exits: [], 
    summary: { totalEntries: 0, totalExits: 0, topEntries: [], topSales: [], topSale: 'N/A', totalCost: 0 }, 
    costs: { totalEntryCost: 0, totalSalesRevenue: 0, margin: 0, breakdown: [] } 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, month]);

  const loadData = async () => {
    setLoading(true);
    const defaultSummary = { totalEntries: 0, totalExits: 0, topEntries: [], topSales: [], topSale: 'N/A', totalCost: 0 };
    const defaultCosts = { totalEntryCost: 0, totalSalesRevenue: 0, margin: 0, breakdown: [] };

    try {
      if (startDate && endDate) {
        const [entries, exits] = await Promise.all([
          getEntriesByPeriod(startDate, endDate),
          getExitsByPeriod(startDate, endDate)
        ]);
        const summary = getSalesReport(entries, exits);
        const costs = getInventoryReport(entries, exits);
        setData({ entries, exits, summary: { ...defaultSummary, ...summary }, costs: { ...defaultCosts, ...costs } });
      } else if (month) {
        const year = month.split('-')[0];
        const monthNum = parseInt(month.split('-')[1], 10);
        const startOfMonth = `${month}-01`;
        const endOfMonth = new Date(year, monthNum, 0).getDate().toString().padStart(2, '0');
        const endOfMonthDate = `${month}-${endOfMonth}`;

        const [entries, exits] = await Promise.all([
          getEntriesByPeriod(startOfMonth, endOfMonthDate),
          getExitsByPeriod(startOfMonth, endOfMonthDate)
        ]);
        const summary = getSalesReport(entries, exits);
        const costs = getInventoryReport(entries, exits);
        setData({ entries, exits, summary: { ...defaultSummary, ...summary }, costs: { ...defaultCosts, ...costs } });
      } else {
        setData({ entries: [], exits: [], summary: defaultSummary, costs: defaultCosts });
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    setStartDate('');
    setEndDate('');
  };

  const handleRangeChange = (type, value) => {
    if (type === 'start') {
      setStartDate(value);
      if (endDate && new Date(value) > new Date(endDate)) setEndDate('');
    } else {
      setEndDate(value);
      if (startDate && new Date(startDate) > new Date(value)) setStartDate('');
    }
    setMonth('');
  };

  return (
    <motion.div
      className="ml-64 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          <FileText className="w-8 h-8 inline mr-2 mb-1" />
          Reportes de Inventario
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700" disabled={loading}>
          <Download className="w-4 h-4" />
          {loading ? 'Generando...' : 'Exportar PDF'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Por Mes</label>
            <input
              type="month"
              value={month}
              onChange={handleMonthChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleRangeChange('start', e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleRangeChange('end', e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>
        {startDate && endDate && (
          <p className="mt-2 text-sm text-gray-600">Período: {startDate} al {endDate}</p>
        )}
        {month && (
          <p className="mt-2 text-sm text-gray-600">Mes: {month}</p>
        )}
        {!startDate && !endDate && !month && (
          <p className="mt-2 text-sm text-gray-500 italic">Selecciona un período para generar el reporte</p>
        )}
        {loading && <p className="mt-2 text-sm text-blue-600">Cargando datos...</p>}
      </div>

      <div className="flex bg-gray-100 rounded-lg mb-6 overflow-hidden">
        {['resumen', 'entradas', 'salidas', 'costos'].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-6 py-3 flex-1 text-center font-medium transition-colors ${
              view === tab
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            {tab === 'resumen' && 'Resumen'}
            {tab === 'entradas' && 'Entradas'}
            {tab === 'salidas' && 'Salidas'}
            {tab === 'costos' && 'Costos'}
          </button>
        ))}
      </div>

      {view === 'resumen' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Resumen General</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-bold text-green-600">{data.summary.totalEntries} entradas</p>
              <p className="text-sm text-gray-600">Total ingresado</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-bold text-red-600">{data.summary.totalExits} salidas</p>
              <p className="text-sm text-gray-600">Total vendido</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-bold text-blue-600">Top Venta: {data.summary.topSale}</p>
              <p className="text-sm text-gray-600">Producto más vendido</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSignIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="font-bold text-purple-600">{formatCurrency(data.summary.totalCost)}</p>
              <p className="text-sm text-gray-600">Costo total</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold mb-3">Top 3 Más Vendidos</h4>
              <ul className="space-y-2">
                {(data.summary.topSales || []).slice(0, 3).map((item, i) => (
                  <li key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>{item.productName}</span>
                    <span className="font-bold">{item.quantity} un.</span>
                  </li>
                ))}
                {(data.summary.topSales || []).length === 0 && (
                  <li className="p-2 text-gray-500 text-center">No hay ventas aún</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Top 3 Más Ingresados</h4>
              <ul className="space-y-2">
                {(data.summary.topEntries || []).slice(0, 3).map((item, i) => (
                  <li key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>{item.productName}</span>
                    <span className="font-bold">{item.quantity} un.</span>
                  </li>
                ))}
                {(data.summary.topEntries || []).length === 0 && (
                  <li className="p-2 text-gray-500 text-center">No hay entradas aún</li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {view === 'entradas' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
          <h3 className="text-xl font-bold mb-4">Reporte de Entradas</h3>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Cantidad</th>
                <th className="p-3 text-left">Costo Unit.</th>
                <th className="p-3 text-left">Total Costo</th>
                <th className="p-3 text-left">Proveedor</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3">{entry.productName}</td>
                  <td className="p-3">{entry.fecha}</td>
                  <td className="p-3 font-bold">{entry.cantidad}</td>
                  <td className="p-3">${entry.costoUnit.toFixed(2)}</td>
                  <td className="p-3 font-bold">{formatCurrency(entry.totalCosto)}</td>
                  <td className="p-3">{entry.proveedorName}</td>
                </tr>
              ))}
              {data.entries.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No hay entradas en este período</td>
                </tr>
              )}
            </tbody>
          </table>
          {!startDate && !endDate && !month && <p className="mt-4 text-sm text-gray-500">Selecciona un período para ver detalles</p>}
        </motion.div>
      )}

      {view === 'salidas' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
          <h3 className="text-xl font-bold mb-4">Reporte de Salidas (Ventas)</h3>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Cantidad</th>
                <th className="p-3 text-left">Precio Venta</th>
                <th className="p-3 text-left">Total Venta</th>
                <th className="p-3 text-left">Receptor / Depto</th>
              </tr>
            </thead>
            <tbody>
              {data.exits.map((exit, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3">{exit.productName}</td>
                  <td className="p-3">{exit.fecha}</td>
                  <td className="p-3 font-bold">{exit.cantidad}</td>
                  <td className="p-3">${exit.precioVenta.toFixed(2)}</td>
                  <td className="p-3 font-bold">{formatCurrency(exit.totalVenta)}</td>
                  <td className="p-3">{exit.receptor} / {exit.departamento}</td>
                </tr>
              ))}
              {data.exits.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No hay salidas en este período</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {view === 'costos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Reporte de Costos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold mb-3">Costo Total de Entradas</h4>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.costs.totalEntryCost)}</p>
              <p className="text-sm text-gray-600">Inversión en inventario</p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Ingresos por Ventas</h4>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.costs.totalSalesRevenue)}</p>
              <p className="text-sm text-gray-600">Dinero generado</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold mb-3">Margen de Ganancia</h4>
              <p className="text-2xl font-bold text-purple-600">
                {data.costs.margin > 0 ? formatCurrency(data.costs.margin) : 'Sin ganancias aún'}
              </p>
              <p className="text-sm text-gray-600">Ventas - Costos</p>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="font-bold mb-3">Desglose por Producto</h4>
            <ul className="space-y-2">
              {data.costs.breakdown.map((item, i) => (
                <li key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{item.productName}</span>
                  <span className="font-bold">Costo: {formatCurrency(item.costo)} | Ganancia: {formatCurrency(item.ganancia)}</span>
                </li>
              ))}
              {data.costs.breakdown.length === 0 && (
                <li className="p-2 text-gray-500 text-center">No hay desglose disponible</li>
              )}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Reports;