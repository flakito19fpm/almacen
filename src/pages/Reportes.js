import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { FileBarChart, Calendar, Filter } from 'lucide-react'

const Reportes = () => {
  const [reportes, setReportes] = useState({
    totalEntradas: 0,
    totalSalidas: 0,
    valorStock: 0,
    gananciasEstimadas: 0,
  })
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [tipo, setTipo] = useState('entradas') // 'entradas' | 'salidas'
  const [movimientos, setMovimientos] = useState([])
  const [uiError, setUiError] = useState('')

  const hasRange = useMemo(() => Boolean(fechaInicio && fechaFin), [fechaInicio, fechaFin])

  // ======== Helpers de fecha (local-safe) ========
  // Crea Date local desde 'YYYY-MM-DD' (evita interpretar como UTC)
  const dateFromYMD = (s) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  // A 'YYYY-MM-DD' desde un Date (local)
  const fmtDateYMD = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Formatea 'YYYY-MM-DD' a 'dd/mm/aaaa' sin crear Date
  const prettyYMD = (s) => {
    if (!s) return '—'
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-')
      return `${d}/${m}/${y}`
    }
    return s
  }

  // Rango inclusivo usando fechas locales: >= inicio y < (fin + 1)
  const applyRange = (q) => {
    if (hasRange) {
      const start = fmtDateYMD(dateFromYMD(fechaInicio))
      const endPlus1 = dateFromYMD(fechaFin)
      endPlus1.setDate(endPlus1.getDate() + 1)
      const endExcl = fmtDateYMD(endPlus1)
      q = q.gte('fecha', start).lt('fecha', endExcl)
    }
    return q
  }

  // ---------- Core ----------
  const generarReportes = useCallback(async (usarRango) => {
    setUiError('')
    try {
      // 1) Totales (por rango si corresponde)
      const entCountQ = supabase.from('entradas').select('*', { count: 'exact', head: true })
      const salCountQ = supabase.from('salidas').select('*', { count: 'exact', head: true })

      const [entRes, salRes] = await Promise.all([
        usarRango ? applyRange(entCountQ) : entCountQ,
        usarRango ? applyRange(salCountQ) : salCountQ,
      ])

      const totalEntradas = entRes.count || 0
      const totalSalidas = salRes.count || 0

      // 2) Stock/ganancias actuales (no por rango)
      const { data: productosData = [] } = await supabase.from('productos').select('*')
      const { data: entradasData = [] } = await supabase
        .from('entradas')
        .select('producto_id, cantidad')
      const { data: salidasData = [] } = await supabase
        .from('salidas')
        .select('producto_id, cantidad')

      const entradasPorProducto = {}
      entradasData.forEach((e) => {
        entradasPorProducto[e.producto_id] =
          (entradasPorProducto[e.producto_id] || 0) + Number(e.cantidad || 0)
      })
      const salidasPorProducto = {}
      salidasData.forEach((s) => {
        salidasPorProducto[s.producto_id] =
          (salidasPorProducto[s.producto_id] || 0) + Number(s.cantidad || 0)
      })

      const productosConStock =
        productosData.map((p) => ({
          ...p,
          stock: (entradasPorProducto[p.id] || 0) - (salidasPorProducto[p.id] || 0),
        })) || []

      const valorStock = productosConStock.reduce(
        (sum, p) => sum + Number(p.stock) * Number(p.precio_venta || 0),
        0
      )
      const gananciasEstimadas = productosConStock.reduce(
        (sum, p) => sum + Number(p.stock) * (Number(p.precio_venta || 0) - Number(p.costo || 0)),
        0
      )

      setReportes({
        totalEntradas,
        totalSalidas,
        valorStock,
        gananciasEstimadas,
      })

      // 3) Movimientos (por rango si corresponde)
      const table = tipo === 'entradas' ? 'entradas' : 'salidas'
      let q = supabase
        .from(table)
        .select('id, fecha, cantidad, producto_id, productos:producto_id (nombre)')
        .order('fecha', { ascending: false })
      if (usarRango) q = applyRange(q)

      let { data: dataJoin, error } = await q
      if (error) {
        // Fallback sin FK declarada
        const plain = supabase
          .from(table)
          .select('id, fecha, cantidad, producto_id')
          .order('fecha', { ascending: false })
        const { data: dataPlain, error: e2 } = usarRango ? applyRange(plain) : plain
        if (e2) throw e2

        const nombrePorId = Object.fromEntries(productosData.map((p) => [p.id, p.nombre || '']))

        setMovimientos(
          (dataPlain || []).map((m) => ({
            id: m.id,
            fecha: m.fecha,
            cantidad: m.cantidad,
            productos: { nombre: nombrePorId[m.producto_id] || '' },
          }))
        )
      } else {
        setMovimientos(dataJoin || [])
      }
    } catch (err) {
      console.error('Error generando reportes:', err)
      setUiError(err?.message || String(err))
      setMovimientos([])
    }
  }, [tipo, fechaInicio, fechaFin, hasRange])

  // Carga inicial (si ya hay rango, lo respeta)
  useEffect(() => {
    generarReportes(hasRange)
  }, [generarReportes, hasRange])

  // Auto-filtrar al cambiar fechas o tipo
  useEffect(() => {
    if (hasRange) generarReportes(true)
  }, [fechaInicio, fechaFin, tipo, hasRange, generarReportes])

  const aplicarFiltro = () => generarReportes(hasRange)

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileBarChart className="w-8 h-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        </div>

        {/* Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Entradas{hasRange ? ' (rango)' : ''}</h2>
            <p className="text-3xl font-bold text-blue-600">{reportes.totalEntradas}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Salidas{hasRange ? ' (rango)' : ''}</h2>
            <p className="text-3xl font-bold text-orange-600">{reportes.totalSalidas}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Valor del Stock</h2>
            <p className="text-3xl font-bold text-green-600">${reportes.valorStock.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Ganancias Estimadas</h2>
            <p className="text-3xl font-bold text-purple-600">${reportes.gananciasEstimadas.toFixed(2)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-yellow-500"
          >
            <option value="entradas">Entradas</option>
            <option value="salidas">Salidas</option>
          </select>

          <Filter className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          />
          <span className="text-gray-600">a</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          />

          <button
            onClick={aplicarFiltro}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        {uiError && <div className="text-sm text-red-600 mb-2">{uiError}</div>}

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hasRange && movimientos.map((mov) => (
                <tr key={mov.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mov.productos?.nombre || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      const f = mov.fecha
                      if (!f) return '—'
                      // Si ya viene como 'YYYY-MM-DD'
                      if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)) return prettyYMD(f)
                      // Si viene con hora/ISO: muéstralo en local
                      try { return new Date(f).toLocaleDateString() } catch { return String(f) }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                    {mov.cantidad}
                  </td>
                </tr>
              ))}
              {(!hasRange || !movimientos.length) && (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-500" colSpan={3}>
                    {hasRange
                      ? 'Sin resultados para el rango seleccionado.'
                      : 'Selecciona un rango de fechas para ver movimientos.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reportes;