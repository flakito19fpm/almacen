import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';
import { showToast } from '../utils/toast';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingProveedor, setEditingProveedor] = useState({
    nombre_comercial: '',
    razon_social: '',
    rfc: '',
    contacto: '',
    telefono: '',
    productos: '',
  });
  const [newProveedor, setNewProveedor] = useState({
    nombre_comercial: '',
    razon_social: '',
    rfc: '',
    contacto: '',
    telefono: '',
    productos: '',
  });

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching proveedores:', error);
      showToast('error', 'Error al cargar proveedores: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProveedores(data || []);
      if (data && data.length > 0) {
        showToast('success', `Cargados ${data.length} proveedores exitosamente`);
      }
    }
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const addProveedor = async () => {
    if (!newProveedor.nombre_comercial) {
      showToast('error', 'El nombre comercial es obligatorio');
      return;
    }
    const { data, error } = await supabase
      .from('proveedores')
      .insert([newProveedor])
      .select();
    if (error) {
      console.error('Error adding proveedor:', error);
      showToast('error', 'Error al agregar proveedor: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProveedores([data[0], ...proveedores]);
      setNewProveedor({ nombre_comercial: '', razon_social: '', rfc: '', contacto: '', telefono: '', productos: '' });
      showToast('success', 'Alta exitosa: Proveedor agregado');
    }
  };

  const updateProveedor = async () => {
    if (!editingProveedor.nombre_comercial) {
      showToast('error', 'El nombre comercial es obligatorio');
      return;
    }
    const { data, error } = await supabase
      .from('proveedores')
      .update(editingProveedor)
      .eq('id', editingId)
      .select();
    if (error) {
      console.error('Error updating proveedor:', error);
      showToast('error', 'Error al actualizar proveedor: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProveedores(proveedores.map(p => (p.id === editingId ? data[0] : p)));
      setEditingId(null);
      setEditingProveedor({ nombre_comercial: '', razon_social: '', rfc: '', contacto: '', telefono: '', productos: '' });
      showToast('success', 'Actualización exitosa: Proveedor guardado');
    }
  };

  const deleteProveedor = async (id) => {
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting proveedor:', error);
      showToast('error', 'Error al eliminar proveedor: ' + (error.message || 'Inténtalo de nuevo'));
    } else {
      setProveedores(proveedores.filter(p => p.id !== id));
      showToast('success', 'Eliminación exitosa: Proveedor borrado');
    }
  };

  const startEditing = (proveedor) => {
    setEditingId(proveedor.id);
    setEditingProveedor({ ...proveedor });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingProveedor({ nombre_comercial: '', razon_social: '', rfc: '', contacto: '', telefono: '', productos: '' });
  };

  const handleInputChange = (field, value) => {
    setEditingProveedor(prev => ({ ...prev, [field]: value }));
  };

  const filteredProveedores = proveedores.filter(p =>
    p.nombre_comercial.toLowerCase().includes(search.toLowerCase()) ||
    p.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    p.rfc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, razón social o RFC..."
              value={search}
              onChange={handleSearch}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <h2 className="text-lg font-semibold mb-4">Agregar Nuevo Proveedor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Nombre Comercial *"
              value={newProveedor.nombre_comercial}
              onChange={(e) => setNewProveedor({ ...newProveedor, nombre_comercial: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 required:border-purple-500"
            />
            <input
              placeholder="Razón Social"
              value={newProveedor.razon_social}
              onChange={(e) => setNewProveedor({ ...newProveedor, razon_social: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              placeholder="RFC"
              value={newProveedor.rfc}
              onChange={(e) => setNewProveedor({ ...newProveedor, rfc: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              placeholder="Contacto"
              value={newProveedor.contacto}
              onChange={(e) => setNewProveedor({ ...newProveedor, contacto: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              placeholder="Teléfono"
              value={newProveedor.telefono}
              onChange={(e) => setNewProveedor({ ...newProveedor, telefono: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              placeholder="Productos (opcional)"
              value={newProveedor.productos}
              onChange={(e) => setNewProveedor({ ...newProveedor, productos: e.target.value })}
              className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={addProveedor}
            disabled={!newProveedor.nombre_comercial}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Agregar Proveedor
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Nombre Comercial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Razón Social</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">RFC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Teléfono / Productos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProveedores.map((proveedor) => (
                <tr key={proveedor.id}>
                  <td className="px-6 py-4">
                    {editingId === proveedor.id ? (
                      <input
                        value={editingProveedor.nombre_comercial}
                        onChange={(e) => handleInputChange('nombre_comercial', e.target.value)}
                        onBlur={updateProveedor}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm font-medium text-gray-900"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-50 p-1 rounded text-sm font-medium text-gray-900"
                        onClick={() => startEditing(proveedor)}
                      >
                        {proveedor.nombre_comercial}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === proveedor.id ? (
                      <input
                        value={editingProveedor.razon_social}
                        onChange={(e) => handleInputChange('razon_social', e.target.value)}
                        onBlur={updateProveedor}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                      />
                    ) : (
                      proveedor.razon_social
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === proveedor.id ? (
                      <input
                        value={editingProveedor.rfc}
                        onChange={(e) => handleInputChange('rfc', e.target.value)}
                        onBlur={updateProveedor}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                      />
                    ) : (
                      proveedor.rfc
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === proveedor.id ? (
                      <input
                        value={editingProveedor.contacto}
                        onChange={(e) => handleInputChange('contacto', e.target.value)}
                        onBlur={updateProveedor}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                      />
                    ) : (
                      proveedor.contacto
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    {editingId === proveedor.id ? (
                      <div className="space-y-1">
                        <input
                          value={editingProveedor.telefono}
                          onChange={(e) => handleInputChange('telefono', e.target.value)}
                          onBlur={updateProveedor}
                          placeholder="Teléfono"
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                        />
                        <input
                          value={editingProveedor.productos}
                          onChange={(e) => handleInputChange('productos', e.target.value)}
                          onBlur={updateProveedor}
                          placeholder="Productos"
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <div>{proveedor.telefono}</div>
                        {proveedor.productos && <div className="text-xs opacity-75 mt-1">{proveedor.productos}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {editingId === proveedor.id ? (
                      <button
                        onClick={updateProveedor}
                        className="text-green-600 hover:text-green-900 p-1 rounded transition-colors mr-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(proveedor)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors mr-2"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (editingId === proveedor.id) {
                          cancelEditing();
                        } else {
                          if (confirm('¿Estás seguro de eliminar este proveedor?')) {
                            deleteProveedor(proveedor.id);
                          }
                        }
                      }}
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

        {filteredProveedores.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay proveedores aún</p>
            <p className="text-gray-400">Agrega uno arriba para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Proveedores;