const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'src/components/dashboard/ErpCockpitDashboard.jsx')
let content = fs.readFileSync(file, 'utf8')

function replaceBetweenTitles(source, currentTitle, nextTitle, replacement) {
  const startNeedle = `    {\n      title: '${currentTitle}'`
  const nextNeedle = `    {\n      title: '${nextTitle}'`

  const start = source.indexOf(startNeedle)
  const end = source.indexOf(nextNeedle, start + 1)

  if (start === -1 || end === -1) {
    console.log(`No encontre bloque: ${currentTitle}`)
    return source
  }

  return source.slice(0, start) + replacement + source.slice(end)
}

content = replaceBetweenTitles(content, 'Nueva compra', 'Recibir mercancia', `    {
      title: 'Nueva compra',
      subtitle: 'Crear compra',
      icon: ShoppingBag,
      color: 'blue',
      moduleText: ['Compras'],
      actionFlow: [
        ['Ordenes de compra', 'Compra', 'Compras'],
        ['Nueva orden', 'Crear orden', 'Nueva compra', 'Crear compra', 'Agregar compra'],
      ],
    },
`)

content = replaceBetweenTitles(content, 'Recibir mercancia', 'Inventario', `    {
      title: 'Recibir mercancia',
      subtitle: 'Crear recepcion',
      icon: Truck,
      color: 'orange',
      moduleText: ['Inventario', 'Inventario y Almacen', 'Compras'],
      actionFlow: [
        ['Recepcion', 'Recibir mercancia'],
        ['Nueva recepcion', 'Crear recepcion', 'Registrar entrada', 'Recibir'],
      ],
    },
`)

content = replaceBetweenTitles(content, 'Inventario', 'Cotizacion', `    {
      title: 'Inventario',
      subtitle: 'Stock y movimientos',
      icon: Warehouse,
      color: 'cyan',
      moduleText: ['Inventario', 'Inventario y Almacen'],
    },
`)

content = replaceBetweenTitles(content, 'Cotizacion', 'Reportes', `    {
      title: 'Cotizacion',
      subtitle: 'Crear cotizacion',
      icon: FileText,
      color: 'blue',
      moduleText: ['Ventas'],
      actionFlow: [
        ['Cotizaciones', 'Cotizacion'],
        ['Nueva cotizacion', 'Crear cotizacion', 'Agregar cotizacion'],
      ],
    },
`)

// Limpia el footer si quedo con simbolos raros antes de 2025
content = content.replace(/<span>.*?2025<\/span>/g, '<span>2025</span>')

fs.writeFileSync(file, content, 'utf8')
console.log('ErpCockpitDashboard.jsx limpiado sin caracteres raros.')
