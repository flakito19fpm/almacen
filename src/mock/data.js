export const mockProveedores = [
  { id: 'prov1', nombre_comercial: 'El Gran Café SA', razon_social: 'Cafetera Suprema SRL', rfc: 'CAF123456ABC', contacto: 'Juanito', telefono: '555-1234', productos: 'Café y más' },
  { id: 'prov2', nombre_comercial: 'Leches Mágicas', razon_social: 'Lácteos Locos Inc', rfc: 'LEC789DEF', contacto: 'María', telefono: '555-5678', productos: 'Leche y derivados' },
];

export const mockProductos = [
  { id: 'prod1', clave: 'CAF001', proveedor_id: 'prov1', nombre: 'Café Arábica Súper', costo: 120.50, tiempo_vida: '6 meses', precio_venta: 200.00 },
  { id: 'prod2', clave: 'LECH001', proveedor_id: 'prov2', nombre: 'Leche Fresca Orgánica', costo: 25.00, tiempo_vida: '1 semana', precio_venta: 40.00 },
  { id: 'prod3', clave: 'CAF002', proveedor_id: 'prov1', nombre: 'Café Molido Rápido', costo: 80.00, tiempo_vida: '3 meses', precio_venta: 150.00 },
];

export const mockEntradas = [
  { id: 'ent1', producto_id: 'prod1', fecha: '2024-10-01', cantidad: 100, proveedor_id: 'prov1' },
  { id: 'ent2', producto_id: 'prod2', fecha: '2024-10-05', cantidad: 200, proveedor_id: 'prov2' },
  { id: 'ent3', producto_id: 'prod3', fecha: '2024-10-03', cantidad: 50, proveedor_id: 'prov1' },
];

export const mockSalidas = [
  { id: 'sal1', producto_id: 'prod1', fecha: '2024-10-10', cantidad: 20, receptor: 'Ana en el Bar', departamento: 'Bar' },
  { id: 'sal2', producto_id: 'prod2', fecha: '2024-10-08', cantidad: 30, receptor: 'Pedro en Cocina', departamento: 'Cocina' },
  { id: 'sal3', producto_id: 'prod3', fecha: '2024-10-12', cantidad: 10, receptor: 'Luis en Oficina', departamento: 'Oficina' },
];

export const getStock = (productoId) => {
  const entradasTotal = mockEntradas.filter(e => e.producto_id === productoId).reduce((sum, e) => sum + e.cantidad, 0);
  const salidasTotal = mockSalidas.filter(s => s.producto_id === productoId).reduce((sum, s) => sum + s.cantidad, 0);
  return entradasTotal - salidasTotal;
};