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
  const [tipo, setTipo] = useState('entradas')
  const [movimientos, setMovimientos] = useState([])
  const [uiError, setUiError] = useState('')

  const hasRange = useMemo(() => Boolean(fechaInicio && fechaFin), [fechaInicio, fechaFin])

  // ======== Helpers de fecha (local-safe) ========
  const dateFromYMD = (s) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const fmtDateYMD = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const prettyYMD = (s) => {
    if (!s) return '—'
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-')
      return `${d}/${m}/${y}`
    }
    return s
  }

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

  // ======== Helpers CSV / impresión ========
  const toCSV = (rows) => {
    if (!rows || !rows.length) return ''
    const cols = Object.keys(rows[0])
    const head = cols.join(',')
    const body = rows
      .map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))
      .join('\n')
    return head + '\n' + body
  }

  const downloadTextFile = (filename, text, mime = 'text/plain;charset=utf-8;') => {
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSVTabla = () => {
    const rows = (movimientos || []).map((m) => {
      let fechaBonita = '—'
      const f = m.fecha
      if (f) {
        if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)) fechaBonita = prettyYMD(f)
        else {
          try { fechaBonita = new Date(f).toLocaleDateString() } catch { fechaBonita = String(f) }
        }
      }
      return {
        Producto: m.productos?.nombre || '',
        Fecha: fechaBonita,
        Cantidad: m.cantidad ?? '',
      }
    })
    if (!rows.length) return
    downloadTextFile(`reporte_${tipo}.csv`, toCSV(rows), 'text/csv;charset=utf-8;')
  }

  const downloadCSVResumen = () => {
    const rows = [
      { Métrica: 'Total Entradas' + (hasRange ? ' (rango)' : ''), Valor: reportes.totalEntradas },
      { Métrica: 'Total Salidas'  + (hasRange ? ' (rango)' : ''), Valor: reportes.totalSalidas },
      { Métrica: 'Valor del Stock', Valor: reportes.valorStock.toFixed(2) },
      { Métrica: 'Ganancias Estimadas', Valor: reportes.gananciasEstimadas.toFixed(2) },
      ...(hasRange ? [{ Métrica: 'Rango', Valor: `${prettyYMD(fechaInicio)} a ${prettyYMD(fechaFin)}` }] : []),
    ]
    downloadTextFile(`resumen_reporte.csv`, toCSV(rows), 'text/csv;charset=utf-8;')
  }

  // ======== Impresión con encabezado y pie ========
const printReport = () => {
  const safe = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]))
  const fechaRango = hasRange ? `${prettyYMD(fechaInicio)} a ${prettyYMD(fechaFin)}` : 'Sin rango'
  const fechaHoraActual = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })

  const tableRows = (movimientos || []).map((m) => {
    let fechaBonita = '—'
    const f = m.fecha
    if (f) {
      if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)) fechaBonita = prettyYMD(f)
      else { try { fechaBonita = new Date(f).toLocaleDateString() } catch { fechaBonita = String(f) } }
    }
    return `<tr>
      <td>${safe(m.productos?.nombre || '')}</td>
      <td>${safe(fechaBonita)}</td>
      <td style="text-align:right;">${safe(m.cantidad)}</td>
    </tr>`
  }).join('')

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Reporte Café Kaawa</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; margin: 24px; color: #111827; }
  header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  header h1 { margin: 0; font-size: 22px; color: #111827; }
  header p { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
  footer { text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 6px; }
  .cards { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin: 16px 0; }
  .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
  .card h3 { margin: 0 0 6px; font-size: 13px; color: #374151; }
  .card .val { font-size: 20px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  thead th { text-align: left; font-size: 12px; text-transform: uppercase; color: #6B7280; border-bottom: 1px solid #e5e7eb; padding: 8px; }
  tbody td { font-size: 13px; border-bottom: 1px solid #f3f4f6; padding: 8px; }
  .right { text-align: right; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
  <header>
    <h1>Café Kaawa – Sistema de Almacén</h1>
    <p>${safe(tipo[0].toUpperCase() + tipo.slice(1))} — Rango: ${safe(fechaRango)}</p>
  </header>

  <div class="cards">
    <div class="card"><h3>Total Entradas${hasRange ? ' (rango)' : ''}</h3><div class="val">${safe(reportes.totalEntradas)}</div></div>
    <div class="card"><h3>Total Salidas${hasRange ? ' (rango)' : ''}</h3><div class="val">${safe(reportes.totalSalidas)}</div></div>
    <div class="card"><h3>Valor del Stock</h3><div class="val">$${safe(reportes.valorStock.toFixed(2))}</div></div>
    <div class="card"><h3>Ganancias Estimadas</h3><div class="val">$${safe(reportes.gananciasEstimadas.toFixed(2))}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Fecha</th>
        <th class="right">Cantidad</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || `<tr><td colspan="3" class="muted">Sin datos para mostrar.</td></tr>`}
    </tbody>
  </table>

  <footer>
    Reporte generado automáticamente por Café Kaawa – Sistema de Almacén<br/>
    Fecha y hora de generación: ${safe(fechaHoraActual)}
  </footer>

  <script>
    window.addEventListener('load', () => {
      window.print();
      setTimeout(() => window.close(), 300);
    });
  </script>
</body>
</html>`

  // 1) Intentamos popup (debe ejecutarse por click del usuario)
  let w = null
  try { w = window.open('', '_blank') } catch { /* noop */ }

  if (w && w.document) {
    w.document.open()
    w.document.write(html)
    w.document.close()
    return
  }

  // 2) Fallback: imprimir en un iframe oculto (sin popups)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow || iframe.contentDocument
  const id = setTimeout(() => {
    try {
      (doc.document || doc).open()
      ;(doc.document || doc).write(html)
      ;(doc.document || doc).close()
      // dar un tick para que el navegador procese estilos
      setTimeout(() => {
        try {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
        } finally {
          // limpiar el iframe después de imprimir
          setTimeout(() => document.body.removeChild(iframe), 1000)
        }
      }, 50)
    } catch (e) {
      console.error('Error imprimiendo en iframe:', e)
      document.body.removeChild(iframe)
    }
  }, 0)
}

  // ---------- Core ----------
  const generarReportes = useCallback(async (usarRango) => {
    setUiError('')
    try {
      const entCountQ = supabase.from('entradas').select('*', { count: 'exact', head: true })
      const salCountQ = supabase.from('salidas').select('*', { count: 'exact', head: true })

      const [entRes, salRes] = await Promise.all([
        usarRango ? applyRange(entCountQ) : entCountQ,
        usarRango ? applyRange(salCountQ) : salCountQ,
      ])

      const totalEntradas = entRes.count || 0
      const totalSalidas = salRes.count || 0

      const { data: productosData = [] } = await supabase.from('productos').select('*')
      const { data: entradasData = [] } = await supabase.from('entradas').select('producto_id, cantidad')
      const { data: salidasData = [] } = await supabase.from('salidas').select('producto_id, cantidad')

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

      const table = tipo === 'entradas' ? 'entradas' : 'salidas'
      let q = supabase
        .from(table)
        .select('id, fecha, cantidad, producto_id, productos:producto_id (nombre)')
        .order('fecha', { ascending: false })
      if (usarRango) q = applyRange(q)

      let { data: dataJoin, error } = await q
      if (error) {
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

  useEffect(() => { generarReportes(hasRange) }, [generarReportes, hasRange])
  useEffect(() => { if (hasRange) generarReportes(true) }, [fechaInicio, fechaFin, tipo, hasRange, generarReportes])

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

        {/* Filtros + Exportaciones */}
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
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
          <span className="text-gray-600">a</span>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />

          <button onClick={aplicarFiltro} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2" title="Aplicar filtro actual">
            <Calendar className="w-4 h-4" /> Filtrar
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={downloadCSVTabla} disabled={!movimientos.length} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50" title={movimientos.length ? 'Exportar CSV (tabla)' : 'Sin datos'}>
              CSV tabla
            </button>
            <button onClick={downloadCSVResumen} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50" title="Exportar CSV del resumen">
              CSV resumen
            </button>
            <button onClick={printReport} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50" title="Imprimir / Guardar como PDF">
              PDF / Imprimir
            </button>
          </div>
        </div>

        {uiError && <div className="text-sm text-red-600 mb-2">{uiError}</div>}

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
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
                      if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)) return prettyYMD(f)
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
                    {hasRange ? 'Sin resultados para el rango seleccionado.' : 'Selecciona un rango de fechas para ver movimientos.'}
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