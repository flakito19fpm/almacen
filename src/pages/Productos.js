import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Package, Plus, Edit, Trash2, Search } from 'lucide-react';
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
      showToast('error', 'Error al cargar productos');
    } else {
      setProductos(data || []);
    }
  };

  const fetchProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('id, nombre_comercial');
    if (error) {
      console.error('Error fetching proveedores:', error);
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

  const updateProducto = async () => {
    if (!editingProducto.clave || !editingProducto.nombre) {
      showToast('error', 'Clave y nombre son obligatorios');
      return;
    }
    const { data, error } = await supabase
      .from('productos')
      .update({
        ...editingProducto,
        costo: parseFloat(editingProducto.costo) || 0,
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

  const deleteProducto = async (id) => {
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

  // ... resto del JSX igual, solo agregué imports y calls a showToast donde aplica

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
              placeholder="Clave (única)"
              value={newProducto.clave}
              onChange={(e) => setNewProducto({ ...newProducto, clave: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Nombre"
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
            />
            <input
              placeholder="Tiempo de Vida"
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
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductos.map((producto) => (
                <tr key={producto.id}>
                  <td className="w-32 px-6 py-4 whitespace-nowrap">
                    <input
                      value={editingId === producto.id ? editingProducto.clave : producto.clave}
                      onChange={(e) =>
                        editingId === producto.id
                          ? setEditingProducto({ ...editingProducto, clave: e.target.value })
                          : null
                      }
                      onBlur={() => editingId === producto.id && updateProducto()}
                      className={`text-sm font-medium ${
                        editingId === producto.id ? 'border border-blue-300' : 'text-gray-900 hover:bg-gray-50'
                      } w-full px-2 py-1 rounded cursor-pointer`}
                      onClick={() => editingId !== producto.id && setEditingProducto(producto) && setEditingId(producto.id)}
                    />
                  </td>
                  <td className="w-64 px-6 py-4 max-w-64 overflow-hidden text-ellipsis text-sm text-gray-900 whitespace-nowrap">
                    {editingId === producto.id ? (
                      <input
                        value={editingProducto.nombre}
                        onChange={(e) =>
                          setEditingProducto({ ...editingProducto, nombre: e.target.value })
                        }
                        onBlur={() => updateProducto()}
                        className="border border-blue-300 w-full px-2 py-1 rounded"
                        autoFocus
                      />
                    ) : (
                      producto.nombre
                    )}
                  </td>
                  <td className="w-24 px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.costo?.toFixed(2)}</td>
                  <td className="w-32 px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.precio_venta?.toFixed(2)}</td>
                  <td className="w-48 px-6 py-4 max-w-48 overflow-hidden text-ellipsis text-sm text-gray-500 whitespace-nowrap">
                    {proveedores.find(p => p.id === producto.proveedor_id)?.nombre_comercial || 'Sin proveedor'}
                  </td>
                  <td className="w-24 px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingId(producto.id || 0) || setEditingProducto(producto)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Productos;