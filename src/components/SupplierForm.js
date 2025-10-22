import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, User, Phone, Hash, Briefcase } from 'lucide-react';
import { saveToStorage, getFromStorage } from '../utils/storage';

const STORAGE_KEYS = {
  suppliers: 'kaawa_suppliers'
};

const SupplierForm = ({ onAddSupplier = () => {}, onClose = () => {}, editingSupplier = null }) => {
  const [formData, setFormData] = useState({
    nombreComercial: editingSupplier?.nombreComercial || '',
    razonSocial: editingSupplier?.razonSocial || '',
    rfc: editingSupplier?.rfc || '',
    contacto: editingSupplier?.contacto || '',
    telefono: editingSupplier?.telefono || '',
    productos: editingSupplier?.productos || ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = '';
    if (name === 'nombreComercial' && !value.trim()) {
      error = 'El nombre comercial es necesario.';
    } else if (name === 'razonSocial' && !value.trim()) {
      error = 'La razón social es necesaria.';
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({
        ...errors,
        [name]: error
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({
      ...touched,
      [name]: true
    });
    const error = validateField(name, value);
    setErrors({
      ...errors,
      [name]: error
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombreComercial.trim()) {
      newErrors.nombreComercial = 'El nombre comercial es necesario.';
    }
    if (!formData.razonSocial.trim()) {
      newErrors.razonSocial = 'La razón social es necesaria.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const suppliers = getFromStorage(STORAGE_KEYS.suppliers);
      let updatedSuppliers;
      if (editingSupplier) {
        updatedSuppliers = suppliers.map(s => s.id === editingSupplier.id ? { ...formData, id: editingSupplier.id } : s);
      } else {
        const newSupplier = {
          id: Date.now().toString(),
          ...formData
        };
        updatedSuppliers = [...suppliers, newSupplier];
        onAddSupplier(newSupplier);
      }
      saveToStorage(STORAGE_KEYS.suppliers, updatedSuppliers);
      setFormData({ nombreComercial: '', razonSocial: '', rfc: '', contacto: '', telefono: '', productos: '' });
      setErrors({});
      setTouched({});
      onClose();
    }
  };

  const InputField = ({ name, label, placeholder, type = 'text', icon: Icon, required = false }) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 ${
            errors[name] ? 'border-red-300 ring-red-200 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {errors[name] && touched[name] && <p className="mt-1 text-sm text-red-600 flex items-center"><Hash className="w-3 h-3 mr-1" /> {errors[name]}</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            name="nombreComercial"
            label="Nombre Comercial"
            placeholder="Ej: Café Supplier MX"
            icon={Briefcase}
            required
          />

          <InputField
            name="razonSocial"
            label="Razón Social"
            placeholder="Ej: Proveedor Café S.A. de C.V."
            icon={Briefcase}
            required
          />

          <InputField
            name="rfc"
            label="RFC"
            placeholder="Ej: PSCMX123456789"
            icon={Hash}
          />

          <InputField
            name="contacto"
            label="Nombre de Contacto"
            placeholder="Ej: Juan Pérez"
            icon={User}
          />

          <InputField
            name="telefono"
            label="Número de Teléfono"
            type="tel"
            placeholder="Ej: 555-123-4567"
            icon={Phone}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Productos que Suministra</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <textarea
                name="productos"
                value={formData.productos}
                onChange={handleChange}
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 resize-none"
                placeholder="Ej: Granos de café, filtros, tazas desechables"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:from-emerald-700 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            {editingSupplier ? 'Actualizar Proveedor' : 'Agregar Proveedor'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SupplierForm;