import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash, X } from 'lucide-react';
import { useToast } from './ToastNotification';
import SearchBar from './SearchBar';
import { supabase, fetchTable, insertRecord, updateRecord, deleteRecord } from '../utils/supabase';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ 
    nombre_comercial: '', 
    razon_social: '', 
    rfc: '', 
    contacto: '', 
    telefono: '', 
    productos: '' 
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const allSuppliers = await fetchTable('proveedores');
      setSuppliers(allSuppliers);
      setFilteredSuppliers(allSuppliers);
    } catch (error) {
      addToast(`Error loading suppliers: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contacto && supplier.contacto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.productos && supplier.productos.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const handleOpenForm = (supplier = null) => {
    if (supplier) {
      setFormData(supplier);
      setEditingSupplier(supplier);
    } else {
      setFormData({ nombre_comercial: '', razon_social: '', rfc: '', contacto: '', telefono: '', productos: '' });
      setEditingSupplier(null);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_comercial.trim() || !formData.razon_social.trim()) {
      addToast('Nombre comercial y razón social son requeridos', 'error');
      return;
    }

    try {
      let updatedSupplier;
      if (editingSupplier) {
        updatedSupplier = await updateRecord('proveedores', editingSupplier.id, {
          ...formData,
          updated_at: new Date().toISOString()
        });
        addToast('Proveedor actualizado con éxito');
      } else {
        updatedSupplier = await insertRecord('proveedores', formData);
        addToast('Proveedor agregado con éxito');
      }

      // Refetch
      await loadSuppliers();
      setIsFormOpen(false);
      setEditingSupplier(null);
      setFormData({ nombre_comercial: '', razon_social: '', rfc: '', contacto: '', telefono: '', productos: '' });
    } catch (error) {
      addToast(`Error saving supplier: ${error.message}`, 'error');
    }
  };

  const handleEdit = (supplier) => {
    handleOpenForm(supplier);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await deleteRecord('proveedores', id);
      addToast('Proveedor eliminado con éxito');
      await loadSuppliers();
    } catch (error) {
      addToast(`Error deleting supplier: ${error.message}`, 'error');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSupplier(null);
    setFormData({ nombre_comercial: '', razon_social: '', rfc: '', contacto: '', telefono: '', productos: '' });
  };

  return (
    <motion.div
      className="ml-64 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Proveedores</h2>
        <button
          onClick={() => handleOpenForm()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar proveedores por nombre, contacto o productos..."
      />

      {isFormOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4"
          onClick={handleCloseForm}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button onClick={handleCloseForm}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre Comercial *"
                value={formData.nombre_comercial}
                onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Razón Social *"
                value={formData.razon_social}
                onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="RFC (opcional)"
                value={formData.rfc}
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Nombre de Contacto (opcional)"
                value={formData.contacto}
                onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Número de Contacto (opcional)"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <textarea
                placeholder="Tipo de Productos (opcional)"
                value={formData.productos}
                onChange={(e) => setFormData({ ...formData, productos: e.target.value })}
                className="w-full p-3 border rounded-lg"
                rows="3"
              />
              <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg">
                {editingSupplier ? 'Actualizar' : 'Guardar'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <motion.div
            key={supplier.id}
            className="bg-white p-6 rounded-lg shadow-md"
            whileHover={{ scale: 1.05 }}
          >
            <>
              <h3 className="font-bold text-lg">{supplier.nombre_comercial}</h3>
              <p className="text-gray-600">{supplier.razon_social}</p>
              {supplier.rfc && <p className="text-sm">RFC: {supplier.rfc}</p>}
              {supplier.contacto && <p>Contacto: {supplier.contacto} - {supplier.telefono}</p>}
              {supplier.productos && <p>Productos: {supplier.productos}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleEdit(supplier)} className="text-blue-600 hover:underline">
                  <Edit className="w-4 h-4 inline mr-1" /> Editar
                </button>
                <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:underline">
                  <Trash className="w-4 h-4 inline mr-1" /> Eliminar
                </button>
              </div>
            </>
          </motion.div>
        ))}
        {filteredSuppliers.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-8">No se encontraron proveedores con ese término.</p>
        )}
      </div>
    </motion.div>
  );
};

export default Suppliers;