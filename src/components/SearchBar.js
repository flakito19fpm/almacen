import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Buscar...' }) => (
  <div className="relative mb-6">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
    <motion.input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
      initial={{ scale: 0.98 }}
      animate={{ scale: 1 }}
    />
  </div>
);

export default SearchBar;