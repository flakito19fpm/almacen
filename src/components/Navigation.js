import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, Truck, ShoppingCart, AlertCircle, List, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventario', label: 'Inventario', icon: List },
  { path: '/reportes', label: 'Reportes', icon: FileText },
  { path: '/proveedores', label: 'Proveedores', icon: Package },
  { path: '/productos', label: 'Productos', icon: Truck },
  { path: '/entradas', label: 'Entradas', icon: ShoppingCart },
  { path: '/salidas', label: 'Salidas', icon: AlertCircle }
];

const Navigation = () => {
  const location = useLocation();

  return (
    <motion.div
      className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Cafe Kaawa</h1>
      </div>
      <nav className="mt-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-4 text-gray-700 hover:bg-gray-100 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
};

export default Navigation;