import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { LogOut, Plus, Trash2, Search } from 'lucide-react';
import { showToast } from '../utils/toast';

const Salidas = () => {
  const [salidas, setSalidas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [newSalida, setNewSalida] = useState({
    producto_id: '',
    fecha: '',
    cantidad: '',
    receptor: '',
    departamento: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    if (productos.length > 0) {
      fetchSalidas();
    }
  }, [productos]);

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('id, nombre');
    if (error) {
      console.error('Error fetching productos:', error);
      showToast('error', 'Error al cargar productos para salidas: ' + (error.message || 'Inténtalo de nuevo'));
      setProductos([]);
    } else {
      setProductos(data || []);
    }
  };

  const fetchSalidas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('salidas')
      .select('*')
      .order('fecha', { ascending: false });
    if (error) {
      console.error('Error fetching salidas:', error);
      showToast('error', 'Error al cargar salidas: ' + (error.message || 'Inténtalo de nuevo'));
      setSalidas([]);
    } else {
      // Mapeo nombres usando productos ya cargados (no join, pa' evitar dramas)
      const salidasConNombres = (data || []).map(salida => ({
        ...salida,
        nombreProducto: productos.find(p => p.id === salida.producto_id)?.nombre || 'Producto no encontrado (chequea ID)',
      }));
      setSalidas(salidasConNombres);
      if (data && data.length > 0) {
        showToast('success', `Cargadas ${data.length} salidas exitosamente`);
      }
    }
    setLoading(false);
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const addSalida = async () => {
    if (!newSalida.producto_id || !newSalida.cantidad || parseInt(newSalida.cantidad) <= 0 || !newSalida.receptor) {
      showToast('error', 'Producto, cantidad (>0) y receptor son obligatorios');
      return;
    }
    setLoading(true);
    const fecha = newSalida.fecha || new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('salidas')
      .insert([{
        producto_id: newSalida.producto_id,
        fecha,
        cantidad: parseInt(newSalida.cantidad),
        receptor: newSalida.receptor,
        departamento: newSalida.departamento || null
      }])
      .select();
    if (error) {
      console.error('Error adding salida:', error);
      showToast('error', 'Error al agregar salida: ' + (error.message || 'Inténtalo de nuevo'));
    } else if (data && data[0]) {
      // Refetch pa' actualizar con nombres
      await fetchProductos();
      await fetchSalidas();
      setNewSalida({ producto_id: '', fecha: '', cantidad: '', receptor: '', departamento: '' });
      showToast('success', 'Alta exitosa: Salida agregada');
    }
    setLoading(false);
  };

  const deleteSalida = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta salida? Esto afectará el stock.')) return;
    setLoading(true);
    const { error } = await supabase.from('salidas').delete().eq('id', id);
    if (error) {
      console.error('Error deleting salida:', error);
      showToast('error', 'Error al eliminar salida: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      await fetchProductos();
      await fetchSalidas();
      showToast('success', 'Eliminación exitosa: Salida borrada (stock actualizado)');
    }
    setLoading(false);
  };

  const filteredSalidas = salidas.filter(s =>
    s.receptor.toLowerCase().includes(search.toLowerCase()) ||
    s.nombreProducto.toLowerCase().includes(search.toLowerCase()) ||
    new Date(s.fecha).toLocaleDateString().includes(search) ||
    (s.departamento || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando salidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <LogOut className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Salidas</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por receptor, producto, fecha o departamento..."
              value={search}
              onChange={handleSearch}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <h2 className="text-lg font-semibold mb-4">Agregar Nueva Salida</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <select
              value={newSalida.producto_id}
              onChange={(e) => setNewSalida({ ...newSalida, producto_id: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              disabled={productos.length === 0 || loading}
            >
              <option value="">Seleccionar Producto</option>
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.nombre}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newSalida.fecha}
              onChange={(e) => setNewSalida({ ...newSalida, fecha: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
            <input
              type="number"
              placeholder="Cantidad"
              value={newSalida.cantidad}
              onChange={(e) => setNewSalida({ ...newSalida, cantidad: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              min="1"
              disabled={loading}
            />
            <input
              placeholder="Receptor"
              value={newSalida.receptor}
              onChange={(e) => setNewSalida({ ...newSalida, receptor: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
            <input
              placeholder="Departamento"
              value={newSalida.departamento}
              onChange={(e) => setNewSalida({ ...newSalida, departamento: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
          </div>
          <button
            onClick={addSalida}
            disabled={!newSalida.producto_id || !newSalida.cantidad || parseInt(newSalida.cantidad) <= 0 || !newSalida.receptor || loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Agregando...' : 'Agregar Salida'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receptor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSalidas.length > 0 ? (
                filteredSalidas.map((salida) => (
                  <tr key={salida.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {salida.nombreProducto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(salida.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                      {salida.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salida.receptor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salida.departamento || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteSalida(salida.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No hay salidas aún. ¡Agrega una para empezar!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {productos.length === 0 && !loading && (
          <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">¡Ups! No hay productos disponibles. Ve a la sección de Productos para agregar algunos antes de registrar salidas.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Salidas;