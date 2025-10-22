import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Package, AlertCircle, Eye } from 'lucide-react';

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [showMovimientos, setShowMovimientos] = useState(null);

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
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

      setProductos(productosConStock);
    } catch (error) {
      console.error('Error fetching inventario:', error);
    }
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const toggleMovimientos = async (productoId) => {
    if (showMovimientos === productoId) {
      setShowMovimientos(null);
      return;
    }

    const { data: movimientos } = await supabase
      .from('entradas')
      .select('id, fecha, cantidad')
      .eq('producto_id', productoId);
    // Aquí podrías agregar salidas también, pero pa' simpleza, solo entradas por ahora
    setShowMovimientos(productoId);
    console.log('Movimientos para', productoId, movimientos); // Pa' debug, quítalo después
  };

  const filteredProductos = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) || p.clave.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-8 h-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">Inventario Detallado</h1>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o clave..."
            value={search}
            onChange={handleSearch}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clave</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo Vida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductos.map((producto) => {
                const esBajoStock = producto.stock < 10;
                return (
                  <React.Fragment key={producto.id}>
                    <tr className={esBajoStock ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.clave}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.nombre}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${esBajoStock ? 'text-red-600' : 'text-green-600'}`}>
                        {producto.stock} {esBajoStock && <AlertCircle className="inline w-4 h-4 ml-1" />}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.tiempo_vida}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleMovimientos(producto.id)}
                          className="text-teal-600 hover:text-teal-900 p-1 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {showMovimientos === producto.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="text-sm text-gray-600">Movimientos: {producto.stock} unidades (ver detalles en consola por ahora)</div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventario;