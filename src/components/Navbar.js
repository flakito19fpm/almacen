import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Package, LogIn, LogOut, BookOpen } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/inventario', icon: Package, label: 'Inventario' },
    { path: '/proveedores', icon: Users, label: 'Proveedores' },
    { path: '/productos', icon: Package, label: 'Productos' },
    { path: '/entradas', icon: LogIn, label: 'Entradas' },
    { path: '/salidas', icon: LogOut, label: 'Salidas' },
    { path: '/reportes', icon: BookOpen, label: 'Reportes' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-indigo-600">
              Inventario Café Kaawa
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;