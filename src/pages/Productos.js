import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Package, Plus, Edit, Trash2, Search, Save, X } from 'lucide-react';
import { showToast } from '../utils/toast';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingProducto, setEditingProducto] = useState({
    clave: '',
    proveedor_id: '',
    nombre: '',
    costo: '',
    tiempo_vida: '',
    precio_venta: '',
  });
  const [newProducto, setNewProducto] = useState({
    clave: '',
    proveedor_id: '',
    nombre: '',
    costo: '',
    tiempo_vida: '',
    precio_venta: '',
  });

  useEffect(() => {
    fetchProductos();
    fetchProveedores();
  }, []);

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
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
      showToast('error', 'Error al cargar proveedores para productos: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProveedores(data || []);
    }
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const addProducto = async () => {
    if (!newProducto.clave || !newProducto.nombre) {
      showToast('error', 'Clave y nombre son obligatorios');
      return;
    }
    const { data, error } = await supabase
      .from('productos')
      .insert([{ ...newProducto, costo: parseFloat(newProducto.costo) || 0, precio_venta: parseFloat(newProducto.precio_venta) || 0 }])
      .select();
    if (error) {
      console.error('Error adding producto:', error);
      showToast('error', 'Error al agregar producto: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProductos([data[0], ...productos]);
      setNewProducto({ clave: '', proveedor_id: '', nombre: '', costo: '', tiempo_vida: '', precio_venta: '' });
      showToast('success', 'Alta exitosa: Producto agregado');
    }
  };

  const startEditing = (producto) => {
    setEditingId(producto.id);
    setEditingProducto({
      clave: producto.clave || '',
      proveedor_id: producto.proveedor_id || '',
      nombre: producto.nombre || '',
      costo: producto.costo?.toString() || '',
      tiempo_vida: producto.tiempo_vida || '',
      precio_venta: producto.precio_venta?.toString() || '',
    });
  };

  const handleEditingChange = (field, value) => {
    setEditingProducto(prev => ({ ...prev, [field]: value }));
  };

  const saveEditing = async () => {
    if (!editingProducto.clave || !editingProducto.nombre) {
      showToast('error', 'Clave y nombre son obligatorios');
      return;
    }
    const { data, error } = await supabase
      .from('productos')
      .update({
        clave: editingProducto.clave,
        proveedor_id: editingProducto.proveedor_id || null,
        nombre: editingProducto.nombre,
        costo: parseFloat(editingProducto.costo) || 0,
        tiempo_vida: editingProducto.tiempo_vida,
        precio_venta: parseFloat(editingProducto.precio_venta) || 0,
      })
      .eq('id', editingId)
      .select();
    if (error) {
      console.error('Error updating producto:', error);
      showToast('error', 'Error al actualizar producto: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProductos(productos.map(p => (p.id === editingId ? data[0] : p)));
      setEditingId(null);
      setEditingProducto({ clave: '', proveedor_id: '', nombre: '', costo: '', tiempo_vida: '', precio_venta: '' });
      showToast('success', 'Actualización exitosa: Producto guardado');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingProducto({ clave: '', proveedor_id: '', nombre: '', costo: '', tiempo_vida: '', precio_venta: '' });
  };

  const deleteProducto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto? Esto afectará entradas y salidas.')) return;
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) {
      console.error('Error deleting producto:', error);
      showToast('error', 'Error al eliminar producto: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProductos(productos.filter(p => p.id !== id));
      showToast('success', 'Eliminación exitosa: Producto borrado');
    }
  };

  const filteredProductos = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) || p.clave.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o clave..."
              value={search}
              onChange={handleSearch}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <h2 className="text-lg font-semibold mb-4">Agregar Nuevo Producto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              placeholder="Clave (única) *"
              value={newProducto.clave}
              onChange={(e) => setNewProducto({ ...newProducto, clave: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Nombre *"
              value={newProducto.nombre}
              onChange={(e) => setNewProducto({ ...newProducto, nombre: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Costo"
              value={newProducto.costo}
              onChange={(e) => setNewProducto({ ...newProducto, costo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              step="0.01"
              min="0"
            />
            <input
              placeholder="Tiempo de Vida (ej: 6 meses)"
              value={newProducto.tiempo_vida}
              onChange={(e) => setNewProducto({ ...newProducto, tiempo_vida: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Precio Venta"
              value={newProducto.precio_venta}
              onChange={(e) => setNewProducto({ ...newProducto, precio_venta: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              step="0.01"
              min="0"
            />
            <select
              value={newProducto.proveedor_id}
              onChange={(e) => setNewProducto({ ...newProducto, proveedor_id: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar Proveedor</option>
              {proveedores.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.nombre_comercial}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addProducto}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Producto
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clave</th>
                <th className="w-64 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo Vida / Proveedor</th>
                <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductos.map((producto) => (
                <tr key={producto.id}>
                  {editingId === producto.id ? (
                    <>
                      <td className="w-32 px-6 py-4">
                        <input
                          value={editingProducto.clave}
                          onChange={(e) => handleEditingChange('clave', e.target.value)}
                          onBlur={saveEditing}
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm font-medium bg-blue-50"
                        />
                      </td>
                      <td className="w-64 px-6 py-4">
                        <input
                          value={editingProducto.nombre}
                          onChange={(e) => handleEditingChange('nombre', e.target.value)}
                          onBlur={saveEditing}
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm bg-blue-50"
                        />
                      </td>
                      <td className="w-24 px-6 py-4">
                        <input
                          type="number"
                          value={editingProducto.costo}
                          onChange={(e) => handleEditingChange('costo', e.target.value)}
                          onBlur={saveEditing}
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm text-gray-900 bg-blue-50"
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="w-32 px-6 py-4">
                        <input
                          type="number"
                          value={editingProducto.precio_venta}
                          onChange={(e) => handleEditingChange('precio_venta', e.target.value)}
                          onBlur={saveEditing}
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm text-gray-900 bg-blue-50"
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="w-48 px-6 py-4">
                        <input
                          placeholder="Tiempo de Vida"
                          value={editingProducto.tiempo_vida}
                          onChange={(e) => handleEditingChange('tiempo_vida', e.target.value)}
                          onBlur={saveEditing}
                          className="w-1/2 px-2 py-1 border border-blue-300 rounded text-sm bg-blue-50 mr-2"
                        />
                        <select
                          value={editingProducto.proveedor_id || ''}
                          onChange={(e) => handleEditingChange('proveedor_id', e.target.value || '')}
                          onBlur={saveEditing}
                          className="w-1/2 px-2 py-1 border border-blue-300 rounded text-sm bg-blue-50"
                        >
                          <option value="">Proveedor</option>
                          {proveedores.map(prov => (
                            <option key={prov.id} value={prov.id}>{prov.nombre_comercial}</option>
                          ))}
                        </select>
                      </td>
                      <td className="w-40 px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={saveEditing}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="w-32 px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{producto.clave}</span>
                      </td>
                      <td className="w-64 px-6 py-4 max-w-64 overflow-hidden text-ellipsis text-sm text-gray-900 whitespace-nowrap">
                        {producto.nombre}
                      </td>
                      <td className="w-24 px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.costo?.toFixed(2)}</td>
                      <td className="w-32 px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.precio_venta?.toFixed(2)}</td>
                      <td className="w-48 px-6 py-4">
                        <div className="max-w-48 overflow-hidden text-ellipsis text-sm text-gray-500">
                          <div className="font-medium">{producto.tiempo_vida || 'N/A'}</div>
                          <div className="text-xs opacity-75">
                            {proveedores.find(p => p.id === producto.proveedor_id)?.nombre_comercial || 'Sin proveedor'}
                          </div>
                        </div>
                      </td>
                      <td className="w-40 px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => startEditing(producto)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProducto(producto.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProductos.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay productos aún</p>
            <p className="text-gray-400">Agrega uno arriba para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Productos;
