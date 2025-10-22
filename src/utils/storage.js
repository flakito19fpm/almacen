import { format, parseISO } from 'date-fns';

const STORAGE_KEYS = {
  suppliers: 'kaawa_suppliers',
  products: 'kaawa_products',
  entries: 'kaawa_entries',
  exits: 'kaawa_exits'
};

export const getFromStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : generateInitialData(key);
};

export const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const generateInitialData = (key) => {
  switch (key) {
    case STORAGE_KEYS.suppliers:
      return [
        { id: '1', nombreComercial: 'Café Supplier MX', razonSocial: 'Proveedor Café S.A. de C.V.', rfc: 'PSCMX123456789', contacto: 'Juan Pérez', telefono: '555-123-4567', productos: 'Granos de café, filtros' },
        { id: '2', nombreComercial: 'Import Beans Ltd', razonSocial: 'Importadora Beans Internacional', rfc: 'IBLI098765432', contacto: 'María López', telefono: '555-987-6543', productos: 'Café orgánico, tazas' }
      ];
    case STORAGE_KEYS.products:
      return [
        { id: 'p1', clave: 'CAF001', proveedorId: '1', nombre: 'Granos de Café Arábica', costo: 150.00, tiempoVida: '6 meses', precioVenta: 250.00, stock: 0 },
        { id: 'p2', clave: 'FIL002', proveedorId: '1', nombre: 'Filtros de Papel', costo: 20.00, tiempoVida: 'N/A', precioVenta: 35.00, stock: 0 },
        { id: 'p3', clave: 'ORG003', proveedorId: '2', nombre: 'Café Orgánico Premium', costo: 200.00, tiempoVida: '12 meses', precioVenta: 350.00, stock: 0 },
        { id: 'p4', clave: 'TAC004', proveedorId: '2', nombre: 'Tazas Desechables', costo: 5.00, tiempoVida: 'N/A', precioVenta: 10.00, stock: 0 }
      ];
    case STORAGE_KEYS.entries:
      return [
        { id: 'e1', productoId: 'p1', fecha: '2024-01-15', cantidad: 10, proveedorId: '1' },
        { id: 'e2', productoId: 'p2', fecha: '2024-01-14', cantidad: 50, proveedorId: '1' }
      ];
    case STORAGE_KEYS.exits:
      return [
        { id: 'x1', productoId: 'p1', fecha: '2024-01-20', cantidad: 5, receptor: 'Ana García', departamento: 'Bar' },
        { id: 'x2', productoId: 'p3', fecha: '2024-01-19', cantidad: 2, receptor: 'Luis Ramírez', departamento: 'Almacén' }
      ];
    default:
      return [];
  }
};

export const calculateStock = (productId, entries, exits) => {
  const entryQty = entries.filter(e => e.productoId === productId).reduce((sum, e) => sum + e.cantidad, 0);
  const exitQty = exits.filter(x => x.productoId === productId).reduce((sum, x) => sum + x.cantidad, 0);
  return Math.max(entryQty - exitQty, 0);
};

export const getLowStockProducts = (products, entries, exits) => {
  return products.filter(p => calculateStock(p.id, entries, exits) <= 1);
};

export const getTotalInventoryValue = (products, entries, exits) => {
  return products.reduce((total, p) => {
    const stock = calculateStock(p.id, entries, exits);
    return total + (stock * p.costo);
  }, 0);
};

export const getMostMovedProduct = (products, entries, exits) => {
  const movements = {};
  const allMovements = [...entries, ...exits];
  
  if (allMovements.length === 0) {
    return null;
  }

  allMovements.forEach(item => {
    if (!movements[item.productoId]) movements[item.productoId] = 0;
    movements[item.productoId] += item.cantidad;
  });

  const topId = Object.keys(movements).reduce((a, b) => movements[a] > movements[b] ? a : b);
  const topProduct = products.find(p => p.id === topId);
  if (topProduct) {
    return { ...topProduct, movimientos: movements[topId] };
  }
  return null;
};

export const getTopMovedProducts = (products, entries, exits) => {
  const salidas = {};
  exits.forEach(item => {
    if (!salidas[item.productoId]) salidas[item.productoId] = 0;
    salidas[item.productoId] += item.cantidad;
  });

  return products
    .map(p => ({
      ...p,
      totalSalidas: salidas[p.id] || 0
    }))
    .sort((a, b) => b.totalSalidas - a.totalSalidas)
    .slice(0, 5);
};

export const getTopValuedProducts = (products, entries, exits) => {
  return products
    .map(p => {
      const stock = calculateStock(p.id, entries, exits);
      return {
        ...p,
        valorTotal: stock * p.costo
      };
    })
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 5);
};

export const getEntriesByPeriod = (start, end) => {
  const products = getFromStorage('kaawa_products');
  const suppliers = getFromStorage('kaawa_suppliers');
  const allEntries = getFromStorage('kaawa_entries');
  const entries = allEntries.filter(e => {
    const date = new Date(e.fecha);
    return date >= new Date(start) && date <= new Date(end);
  }).map(e => {
    const product = products.find(p => p.id === e.productoId);
    const supplier = suppliers.find(s => s.id === e.proveedorId);
    return {
      ...e,
      productName: product ? product.nombre : 'N/A',
      costoUnit: product ? product.costo : 0,
      totalCosto: (e.cantidad * (product ? product.costo : 0)),
      proveedorName: supplier ? supplier.nombreComercial : 'N/A'
    };
  });
  return entries;
};

export const getExitsByPeriod = (start, end) => {
  const products = getFromStorage('kaawa_products');
  const allExits = getFromStorage('kaawa_exits');
  const exits = allExits.filter(e => {
    const date = new Date(e.fecha);
    return date >= new Date(start) && date <= new Date(end);
  }).map(e => {
    const product = products.find(p => p.id === e.productoId);
    return {
      ...e,
      productName: product ? product.nombre : 'N/A',
      precioVenta: product ? product.precioVenta : 0,
      totalVenta: (e.cantidad * (product ? product.precioVenta : 0))
    };
  });
  return exits;
};

export const getSalesReport = (entries, exits) => {
  const entryTotals = {};
  const exitTotals = {};
  const entryProducts = {};
  const exitProducts = {};

  entries.forEach(e => {
    if (!entryTotals[e.productoId]) entryTotals[e.productoId] = 0;
    entryTotals[e.productoId] += e.cantidad;
    if (!entryProducts[e.productoId]) entryProducts[e.productoId] = { name: e.productName, quantity: 0 };
    entryProducts[e.productoId].quantity += e.cantidad;
  });

  exits.forEach(e => {
    if (!exitTotals[e.productoId]) exitTotals[e.productoId] = 0;
    exitTotals[e.productoId] += e.cantidad;
    if (!exitProducts[e.productoId]) exitProducts[e.productoId] = { name: e.productName, quantity: 0 };
    exitProducts[e.productoId].quantity += e.cantidad;
  });

  const topEntries = Object.entries(entryProducts).map(([id, data]) => ({ productName: data.name, quantity: data.quantity })).sort((a, b) => b.quantity - a.quantity);
  const topSales = Object.entries(exitProducts).map(([id, data]) => ({ productName: data.name, quantity: data.quantity })).sort((a, b) => b.quantity - a.quantity);
  const topSale = topSales[0] ? topSales[0].productName : 'N/A';

  return {
    totalEntries: entries.length,
    totalExits: exits.length,
    topEntries,
    topSales,
    topSale,
    totalCost: entries.reduce((sum, e) => sum + e.totalCosto, 0)
  };
};

export const getInventoryReport = (entries, exits) => {
  const products = getFromStorage('kaawa_products');
  const breakdown = products.map(p => {
    const productEntries = entries.filter(e => e.productoId === p.id);
    const productExits = exits.filter(e => e.productoId === p.id);
    const totalEntryCost = productEntries.reduce((sum, e) => sum + (e.cantidad * p.costo), 0);
    const totalSalesRevenue = productExits.reduce((sum, e) => sum + (e.cantidad * p.precioVenta), 0);
    return {
      productName: p.nombre,
      costo: totalEntryCost,
      ganancia: totalSalesRevenue - totalEntryCost
    };
  });

  const totalEntryCost = entries.reduce((sum, e) => sum + e.totalCosto, 0);
  const totalSalesRevenue = exits.reduce((sum, e) => sum + e.totalVenta, 0);
  const margin = totalSalesRevenue - totalEntryCost;

  return {
    totalEntryCost,
    totalSalesRevenue,
    margin,
    breakdown
  };
};