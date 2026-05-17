const fs = require('fs')
const path = require('path')

const files = [
  'src/components/dashboard/ErpCockpitDashboard.css',
  'src/components/dashboard/ErpCockpitDashboard.jsx',
  'src/components/ModuleWorkModeController.jsx',
  'src/styles/index.css',
]

const replacements = [
  ['\u00C3\u00A1', 'a'],
  ['\u00C3\u00A9', 'e'],
  ['\u00C3\u00AD', 'i'],
  ['\u00C3\u00B3', 'o'],
  ['\u00C3\u00BA', 'u'],
  ['\u00C3\u00B1', 'n'],
  ['\u00C3\u0081', 'A'],
  ['\u00C3\u0089', 'E'],
  ['\u00C3\u008D', 'I'],
  ['\u00C3\u0093', 'O'],
  ['\u00C3\u009A', 'U'],
  ['\u00C3\u0091', 'N'],

  ['Ã¡', 'a'],
  ['Ã©', 'e'],
  ['Ãí', 'i'],
  ['Ã³', 'o'],
  ['Ãº', 'u'],
  ['Ã±', 'n'],
  ['ÃÁ', 'A'],
  ['Ã‰', 'E'],
  ['ÃÍ', 'I'],
  ['Ã“', 'O'],
  ['Ãš', 'U'],
  ['ÃÑ', 'N'],

  ['Â¿', ''],
  ['Â¡', ''],
  ['Âº', 'o'],
  ['Âª', 'a'],
  ['Â°', ' grados'],
  ['Â', ''],

  ['â€“', '-'],
  ['â€”', '-'],
  ['â€˜', "'"],
  ['â€™', "'"],
  ['â€œ', '"'],
  ['â€\u009D', '"'],
  ['â€¦', '...'],
  ['â€¢', '-'],
  ['â†’', '->'],
  ['�', ''],
]

const cleanWords = [
  ['Submódulos', 'Submodulos'],
  ['Categorías', 'Categorias'],
  ['Recepción', 'Recepcion'],
  ['Multiubicación', 'Multiubicacion'],
  ['Reposición', 'Reposicion'],
  ['Almacén', 'Almacen'],
  ['Módulo', 'Modulo'],
  ['módulo', 'modulo'],
  ['Contraseña', 'Contrasena'],
  ['contraseña', 'contrasena'],
  ['sesión', 'sesion'],
  ['Sesión', 'Sesion'],
  ['Configuración', 'Configuracion'],
  ['configuración', 'configuracion'],
  ['rápidos', 'rapidos'],
  ['Rápidos', 'Rapidos'],
  ['operación', 'operacion'],
  ['Operación', 'Operacion'],
  ['información', 'informacion'],
  ['Información', 'Informacion'],
  ['notificación', 'notificacion'],
  ['Notificación', 'Notificacion'],
]

function fixText(content) {
  let output = content

  for (let round = 0; round < 5; round += 1) {
    const before = output

    for (const [bad, good] of replacements) {
      output = output.split(bad).join(good)
    }

    for (const [bad, good] of cleanWords) {
      output = output.split(bad).join(good)
    }

    if (output === before) break
  }

  return output
}

for (const file of files) {
  const fullPath = path.join(process.cwd(), file)

  if (!fs.existsSync(fullPath)) {
    console.log('No existe:', file)
    continue
  }

  const original = fs.readFileSync(fullPath, 'utf8')
  const cleaned = fixText(original)

  if (cleaned !== original) {
    fs.writeFileSync(fullPath, cleaned, 'utf8')
    console.log('Corregido:', file)
  } else {
    console.log('Sin cambios:', file)
  }
}

console.log('Limpieza de 4 archivos terminada.')
