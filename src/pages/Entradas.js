import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { LogIn, Plus, Trash2, Search } from 'lucide-react';
import { showToast } from '../utils/toast';

const Entradas = () => {
  const [entradas, setEntradas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState('');
  const [newEntrada, setNewEntrada] = useState({
    producto_id: '',
    fecha: '',
    cantidad: '',
    proveedor_id: '',
  });

  useEffect(() => {
    fetchProductos();
    fetchProveedores();
  }, []);

  useEffect(() => {
    if (productos.length > 0 && proveedores.length > 0) {
      fetchEntradas();
    }
  }, [productos, proveedores]);

  const fetchEntradas = async () => {
    const { data, error } = await supabase
      .from('entradas')
      .select(`
        *, 
        productos!entradas_producto_id_fkey(id, nombre),
        proveedores!entradas_proveedor_id_fkey(id, nombre_comercial)
      `)
      .order('fecha', { ascending: false });
    if (error) {
      console.error('Error fetching entradas:', error);
      showToast('error', 'Error al cargar entradas: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setEntradas(data || []);
      if (data && data.length > 0) {
        showToast('success', `Cargadas ${data.length} entradas exitosamente`);
      }
    }
  };

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('id, nombre');
    if (error) {
      console.error('Error fetching productos:', error);
      showToast('error', 'Error al cargar productos: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProductos(data || []);
    }
  };

  const fetchProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('id, nombre_comercial');
    if (error) {
      console.error('Error fetching proveedores:', error);
      showToast('error', 'Error al cargar proveedores: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProveedores(data || []);
    }
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const addEntrada = async () => {
    if (!newEntrada.producto_id || !newEntrada.cantidad || newEntrada.cantidad <= 0) {
      showToast('error', 'Producto y cantidad son obligatorios (mayor a 0)');
      return;
    }
    const fecha = newEntrada.fecha || new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('entradas')
      .insert([{ 
        producto_id: newEntrada.producto_id, 
        fecha, 
        cantidad: parseInt(newEntrada.cantidad), 
        proveedor_id: newEntrada.proveedor_id || null 
      }])
      .select();
    if (error) {
      console.error('Error adding entrada:', error);
      showToast('error', 'Error al agregar entrada: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setEntradas([data[0], ...entradas]);
      setNewEntrada({ producto_id: '', fecha: '', cantidad: '', proveedor_id: '' });
      showToast('success', 'Alta exitosa: Entrada agregada');
      fetchProductos(); // Recalcular en dashboard si es necesario
    }
  };

  const deleteEntrada = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta entrada?')) return;
    const { error } = await supabase.from('entradas').delete().eq('id', id);
    if (error) {
      console.error('Error deleting entrada:', error);
      showToast('error', 'Error al eliminar entrada: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setEntradas(entradas.filter(e => e.id !== id));
      showToast('success', 'Eliminación exitosa: Entrada borrada');
      fetchProductos();
    }
  };

  const filteredEntradas = entradas.filter(e =>
    new Date(e.fecha).toLocaleDateString().includes(search) ||
    e.productos?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    e.proveedores?.nombre_comercial?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <LogIn className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Entradas</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por fecha, producto o proveedor..."
              value={search}
              onChange={handleSearch}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <h2 className="text-lg font-semibold mb-4">Agregar Nueva Entrada</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <select
              value={newEntrada.producto_id}
              onChange={(e) => setNewEntrada({ ...newEntrada, producto_id: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 required:border-blue-500"
              required
            >
              <option value="">Seleccionar Producto *</option>
              {productos.map(prod => (
                <option key={prod.id} value={prod.id}>{prod.nombre}</option>
              ))}
            </select>
            <input
              type="date"
              value={newEntrada.fecha}
              onChange={(e) => setNewEntrada({ ...newEntrada, fecha: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Cantidad *"
              value={newEntrada.cantidad}
              onChange={(e) => setNewEntrada({ ...newEntrada, cantidad: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 required:border-blue-500"
              min="1"
              required
            />
            <select
              value={newEntrada.proveedor_id || ''}
              onChange={(e) => setNewEntrada({ ...newEntrada, proveedor_id: e.target.value || null })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar Proveedor (opcional)</option>
              {proveedores.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.nombre_comercial}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addEntrada}
            disabled={!newEntrada.producto_id || !newEntrada.cantidad || newEntrada.cantidad <= 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Agregar Entrada
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntradas.length > 0 ? (
                filteredEntradas.map((entrada) => (
                  <tr key={entrada.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entrada.productos?.nombre || 'Sin producto'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entrada.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {entrada.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entrada.proveedores?.nombre_comercial || 'Sin proveedor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteEntrada(entrada.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No hay entradas aún. ¡Agrega una para empezar!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Entradas;