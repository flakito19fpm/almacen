import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { FileBarChart, Calendar, Filter, Download } from 'lucide-react'

const LOW_STOCK_FALLBACK = 5 // si el producto no tiene min_stock

const Reportes = () => {
  const [reportes, setReportes] = useState({
    totalEntradas: 0,
    totalSalidas: 0,
    valorStock: 0,
    gananciasEstimadas: 0
  })
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [tipoReporte, setTipoReporte] = useState('entradas') // 'entradas' | 'salidas' | 'cero' | 'baja'
  const [rows, setRows] = useState([]) // filas mostradas en la tabla
  const [loading, setLoading] = useState(false)

  // utilidades
  const hasDates = useMemo(() => Boolean(fechaInicio && fechaFin), [fechaInicio, fechaFin])

  useEffect(() => {
    generarReportes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generarReportes(applyFilter = false) {
    setLoading(true)
    try {
      // --- 1) Datos base para tarjetas (pueden respetar el filtro si applyFilter === true)
      const entradasCountQuery = supabase.from('entradas').select('*', { count: 'exact', head: true })
      const salidasCountQuery = supabase.from('salidas').select('*', { count: 'exact', head: true })

      const entradasAggQuery = supabase.from('entradas').select('producto_id, cantidad, fecha')
      const salidasAggQuery = supabase.from('salidas').select('producto_id, cantidad, fecha')
      const productosQuery = supabase.from('productos').select('*')

      // aplicar rango de fechas si corresponde
      const withDate = (q) =>
        applyFilter && hasDates ? q.gte('fecha', fechaInicio).lte('fecha', fechaFin) : q

      const [{ count: totalEntradas = 0 }, { count: totalSalidas = 0 }] = await Promise.all([
        withDate(entradasCountQuery),
        withDate(salidasCountQuery)
      ])

      const [{ data: productosData = [] }, { data: entradasData = [] }, { data: salidasData = [] }] =
        await Promise.all([productosQuery, withDate(entradasAggQuery), withDate(salidasAggQuery)])

      // calcular stock por producto a partir de entradas - salidas
      const sumBy = (arr) => {
        const m = {}
        arr?.forEach((r) => {
          m[r.producto_id] = (m[r.producto_id] || 0) + Number(r.cantidad || 0)
        })
        return m
      }
      const entradasPorProducto = sumBy(entradasData)
      const salidasPorProducto = sumBy(salidasData)

      const productosConStock = productosData.map((p) => {
        const stock = (entradasPorProducto[p.id] || 0) - (salidasPorProducto[p.id] || 0)
        const min = Number(p.min_stock ?? LOW_STOCK_FALLBACK)
        return { ...p, stock, min_stock: min }
      })

      const valorStock = productosConStock.reduce(
        (sum, p) => sum + (Number(p.stock) * Number(p.precio_venta || 0)),
        0
      )
      const gananciasEstimadas = productosConStock.reduce(
        (sum, p) =>
          sum + Number(p.stock) * (Number(p.precio_venta || 0) - Number(p.costo || 0)),
        0
      )

      setReportes({
        totalEntradas,
        totalSalidas,
        valorStock,
        gananciasEstimadas
      })

      // --- 2) Filas de la tabla según tipo de reporte
      if (tipoReporte === 'entradas' || tipoReporte === 'salidas') {
        // movimientos con join de producto
        const table = tipoReporte === 'entradas' ? 'entradas' : 'salidas'
        let q = supabase
          .from(table)
          .select('id, fecha, cantidad, productos(nombre, codigo)')
          .order('fecha', { ascending: false })

        if (applyFilter && hasDates) {
          q = q.gte('fecha', fechaInicio).lte('fecha', fechaFin)
        }

        const { data: movimientos = [] } = await q

        const asRows = movimientos.map((m) => ({
          Fecha: new Date(m.fecha).toLocaleString(),
          Codigo: m.productos?.codigo ?? '',
          Producto: m.productos?.nombre ?? '',
          Cantidad: Number(m.cantidad || 0)
        }))
        setRows(asRows)
      } else if (tipoReporte === 'cero') {
        const asRows = productosConStock
          .filter((p) => Number(p.stock) === 0)
          .map((p) => ({
            Codigo: p.codigo || '',
            Producto: p.nombre || '',
            Stock: Number(p.stock || 0),
            Minimo: Number(p.min_stock)
          }))
        setRows(asRows)
      } else if (tipoReporte === 'baja') {
        const asRows = productosConStock
          .filter((p) => Number(p.stock) <= Number(p.min_stock))
          .map((p) => ({
            Codigo: p.codigo || '',
            Producto: p.nombre || '',
            Stock: Number(p.stock || 0),
            Minimo: Number(p.min_stock)
          }))
        setRows(asRows)
      }
    } catch (error) {
      console.error('Error generando reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  // exportar CSV de lo que esté en la tabla
  function toCSV(data) {
    if (!data || !data.length) return ''
    const cols = Object.keys(data[0])
    const head = cols.join(',')
    const body = data
      .map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))
      .join('\n')
    return head + '\n' + body
  }
  function downloadCSV() {
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_${tipoReporte}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalResumen = useMemo(() => {
    if (!rows.length) return 0
    if (tipoReporte === 'entradas' || tipoReporte === 'salidas') {
      return rows.reduce((a, r) => a + Number(r.Cantidad || 0), 0)
    }
    return rows.length
  }, [rows, tipoReporte])

  const columnas = useMemo(() => Object.keys(rows[0] || {}), [rows])

  const aplicarFiltro = () => {
    generarReportes(true)
  }

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
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Entradas{hasDates ? ' (rango)' : ''}</h2>
            <p className="text-3xl font-bold text-blue-600">{reportes.totalEntradas}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Salidas{hasDates ? ' (rango)' : ''}</h2>
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
            value={tipoReporte}
            onChange={(e) => setTipoReporte(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
          >
            <option value="entradas">Entradas</option>
            <option value="salidas">Salidas</option>
            <option value="cero">Productos en cero</option>
            <option value="baja">Productos con baja existencia</option>
          </select>

          <Filter className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
          />
          <span className="text-gray-600">a</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
          />

          <button
            onClick={() => generarReportes(true)}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Filtrar
          </button>

          <button
            onClick={downloadCSV}
            disabled={!rows.length}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-black flex items-center gap-2 disabled:opacity-50"
            title={rows.length ? 'Exportar CSV' : 'No hay datos para exportar'}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Resumen del reporte actual */}
        <div className="mb-3 text-sm text-gray-700">
          {tipoReporte === 'entradas' && <>Total entradas (tabla): <b>{totalResumen}</b></>}
          {tipoReporte === 'salidas' && <>Total salidas (tabla): <b>{totalResumen}</b></>}
          {tipoReporte === 'cero' && <>Productos en cero: <b>{totalResumen}</b></>}
          {tipoReporte === 'baja' && <>Productos con baja existencia: <b>{totalResumen}</b></>}
          {hasDates && <span className="ml-2 text-gray-500">• Rango: {fechaInicio} a {fechaFin}</span>}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columnas.length
                    ? columnas.map((c) => (
                        <th
                          key={c}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {c}
                        </th>
                      ))
                    : (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sin datos
                      </th>
                    )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={columnas.length || 1}>
                      Cargando…
                    </td>
                  </tr>
                )}
                {!loading && rows.map((r, idx) => (
                  <tr key={idx}>
                    {columnas.map((k) => (
                      <td key={k} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {String(r[k])}
                      </td>
                    ))}
                  </tr>
                ))}
                {!loading && !rows.length && (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={columnas.length || 1}>
                      No hay registros para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acción para refrescar cuando cambie el tipo de reporte */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => generarReportes(hasDates)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Actualizar reporte
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reportes
