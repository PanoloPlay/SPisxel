// -------------------- Helpers --------------------
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function rgbDist(a, b) { const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return dr * dr + dg * dg + db * db }
function lerp(a, b, t) {
  return a + (b - a) * t
}

// Interpolación de color en RGB
function lerpColorRGB(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t))
  ]
}

// K-means clustering (simple)
function kmeans(colors, k, maxIter = 12) {
  if (colors.length <= k) {
    const unique = Array.from(new Map(colors.map(c => [c.join(','), c])).values())
    while (unique.length < k) unique.push(unique[0])
    return unique.slice(0, k)
  }
  const centers = []
  const used = new Set()
  while (centers.length < k) {
    const idx = Math.floor(Math.random() * colors.length)
    if (!used.has(idx)) { centers.push(colors[idx].slice()); used.add(idx) }
  }
  const assignments = new Array(colors.length).fill(-1)
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false
    for (let i = 0; i < colors.length; i++) {
      let best = 0, bestd = Infinity
      for (let c = 0; c < centers.length; c++) {
        const d = rgbDist(colors[i], centers[c])
        if (d < bestd) { bestd = d; best = c }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true }
    }
    const sums = Array.from({ length: centers.length }, () => [0, 0, 0, 0])
    for (let i = 0; i < colors.length; i++) {
      const a = assignments[i]
      const col = colors[i]
      sums[a][0] += col[0]; sums[a][1] += col[1]; sums[a][2] += col[2]; sums[a][3]++
    }
    for (let c = 0; c < centers.length; c++) {
      if (sums[c][3] === 0) continue
      centers[c][0] = Math.round(sums[c][0] / sums[c][3])
      centers[c][1] = Math.round(sums[c][1] / sums[c][3])
      centers[c][2] = Math.round(sums[c][2] / sums[c][3])
    }
    if (!changed) break
  }
  return centers
}

// Parse #rrggbb or rgb(r,g,b)
function parseColor(str) {
  if (!str) return null
  str = str.trim()
  if (str.startsWith('#')) {
    if (str.length === 4) {
      const r = str[1], g = str[2], b = str[3]
      return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)]
    } else if (str.length === 7) {
      return [parseInt(str.slice(1, 3), 16), parseInt(str.slice(3, 5), 16), parseInt(str.slice(5, 7), 16)]
    }
    return null
  } else if (str.toLowerCase().startsWith('rgb')) {
    const m = str.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i)
    if (m) return [clamp(parseInt(m[1]), 0, 255), clamp(parseInt(m[2]), 0, 255), clamp(parseInt(m[3]), 0, 255)]
    return null
  }
  return null
}

// -------------------- UI Elements --------------------
const fileInput = document.getElementById('file')
const blockRange = document.getElementById('block')
const blockVal = document.getElementById('blockVal')
const colorsRange = document.getElementById('colors')
const colorsVal = document.getElementById('colorsVal')
const processBtn = document.getElementById('process')
const downloadBtn = document.getElementById('download')
const outCanvas = document.getElementById('out')
const hiddenCanvas = document.getElementById('hidden')
const modeSelect = document.getElementById('mode')
const filterSelect = document.getElementById('filter')
const customArea = document.getElementById('customArea')
const newColor = document.getElementById('newColor')
const addColor = document.getElementById('addColor')
const colorList = document.getElementById('colorList')

const minus1 = document.getElementById('minus1')
const plus1 = document.getElementById('plus1')
const minus5 = document.getElementById('minus5')
const plus5 = document.getElementById('plus5')
const cminus1 = document.getElementById('cminus1')
const cplus1 = document.getElementById('cplus1')
const cminus5 = document.getElementById('cminus5')
const cplus5 = document.getElementById('cplus5')
const cminus10 = document.getElementById('cminus10')
const cplus10 = document.getElementById('cplus10')
const cmin = document.getElementById('cmin')
const cmax = document.getElementById('cmax')
const MIN_COLORS = 2
const MAX_COLORS = 512

const presetSmall = document.getElementById('presetSmall')
const presetMedium = document.getElementById('presetMedium')
const presetLarge = document.getElementById('presetLarge')
const cpresetSmall = document.getElementById('cpresetSmall')
const cpresetMedium = document.getElementById('cpresetMedium')
const cpresetLarge = document.getElementById('cpresetLarge')

const resetBtn = document.getElementById('reset')

let img = new Image()
let loaded = false
let maxDim = 1200
let customColors = []
let lastPixelArtCanvas = null

// -------------------- UI Sync --------------------

blockRange.addEventListener('input', () => blockVal.textContent = blockRange.value)
colorsRange.addEventListener('input', () => colorsVal.textContent = colorsRange.value)

minus1.addEventListener('click', () => { blockRange.value = clamp(parseInt(blockRange.value) - 1, 1, 128); blockVal.textContent = blockRange.value })
plus1.addEventListener('click', () => { blockRange.value = clamp(parseInt(blockRange.value) + 1, 1, 128); blockVal.textContent = blockRange.value })
minus5.addEventListener('click', () => { blockRange.value = clamp(parseInt(blockRange.value) - 5, 1, 128); blockVal.textContent = blockRange.value })
plus5.addEventListener('click', () => { blockRange.value = clamp(parseInt(blockRange.value) + 5, 1, 128); blockVal.textContent = blockRange.value })

cminus1.addEventListener('click', () => { colorsRange.value = clamp(parseInt(colorsRange.value) - 1, 2, 512); colorsVal.textContent = colorsRange.value })
cplus1.addEventListener('click', () => { colorsRange.value = clamp(parseInt(colorsRange.value) + 1, 2, 512); colorsVal.textContent = colorsRange.value })
cminus5.addEventListener('click', () => { colorsRange.value = clamp(parseInt(colorsRange.value) - 5, 2, 512); colorsVal.textContent = colorsRange.value })
cplus5.addEventListener('click', () => { colorsRange.value = clamp(parseInt(colorsRange.value) + 5, 2, 512); colorsVal.textContent = colorsRange.value })
cminus10.addEventListener('click', () => { colorsRange.value = clamp(parseInt(colorsRange.value) - 10, 2, 512); colorsVal.textContent = colorsRange.value })
cplus10.addEventListener('click', () => { colorsRange.value = clamp(parseInt(colorsRange.value) + 10, 2, 512); colorsVal.textContent = colorsRange.value })
cmin.addEventListener('click', () => { colorsRange.value = MIN_COLORS; colorsVal.textContent = "Min(2)" })
cmax.addEventListener('click', () => { colorsRange.value = MAX_COLORS; colorsVal.textContent = "Max(512)" })


presetSmall.addEventListener('click', () => { blockRange.value = 8; blockVal.textContent = 8 })
presetMedium.addEventListener('click', () => { blockRange.value = 16; blockVal.textContent = 16 })
presetLarge.addEventListener('click', () => { blockRange.value = 32; blockVal.textContent = 32 })
cpresetSmall.addEventListener('click', () => { colorsRange.value = 8; colorsVal.textContent = 8 })
cpresetMedium.addEventListener('click', () => { colorsRange.value = 16; colorsVal.textContent = 16 })
cpresetLarge.addEventListener('click', () => { colorsRange.value = 32; colorsVal.textContent = 32 })



fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const url = URL.createObjectURL(f)
  img = new Image()
  img.onload = () => { loaded = true; drawPreview(img); URL.revokeObjectURL(url) }
  img.src = url
})

function drawPreview(image) {
  const ctx = outCanvas.getContext('2d')
  const maxW = 800
  const ratio = image.width / image.height
  const w = Math.min(maxW, image.width)
  const h = Math.round(w / ratio)
  outCanvas.width = w
  outCanvas.height = h
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(image, 0, 0, w, h)
}

filterSelect.addEventListener('change', () => {
  customArea.style.display = filterSelect.value === 'custom' ? 'block' : 'none'
})

// -------------------- Custom colors UI --------------------
function renderCustomList() {
  colorList.innerHTML = '';
  customColors.forEach((c, idx) => {
    const hex = '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
    const div = document.createElement('div');
    div.className = 'color-item';
    div.innerHTML = `
      <div class="color-sample" style="background:${hex}"></div>
      <div class="color-code">${hex}</div>
      <div class="color-actions">
        <button data-idx="${idx}" class="small-btn" data-action="up">↑</button>
        <button data-idx="${idx}" class="small-btn" data-action="down">↓</button>
        <button data-idx="${idx}" class="small-btn danger" data-action="del">Eliminar</button>
      </div>
    `;

    colorList.appendChild(div);
  });
}


colorList.addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (!btn) return
  const idx = parseInt(btn.getAttribute('data-idx'))
  const action = btn.getAttribute('data-action')
  if (action === 'del') { customColors.splice(idx, 1); renderCustomList(); return }
  if (action === 'up' && idx > 0) { const v = customColors[idx]; customColors.splice(idx, 1); customColors.splice(idx - 1, 0, v); renderCustomList(); return }
  if (action === 'down' && idx < customColors.length - 1) { const v = customColors[idx]; customColors.splice(idx, 1); customColors.splice(idx + 1, 0, v); renderCustomList(); return }
})

addColor.addEventListener('click', () => {
  const parsed = parseColor(newColor.value)
  if (!parsed) return alert('Color no válido. Usa #rrggbb o rgb(r,g,b)')
  customColors.push(parsed)
  renderCustomList()
})

// -------------------- Procesamiento --------------------
async function processImage() {
  if (!loaded) return alert('Sube una imagen primero')
  const block = parseInt(blockRange.value, 10)
  const paletteSize = parseInt(colorsRange.value, 10)
  const mode = modeSelect.value

  const ratio = img.width / img.height
  let sx = img.width, sy = img.height
  if (Math.max(sx, sy) > maxDim) {
    if (sx > sy) { sx = maxDim; sy = Math.round(maxDim / ratio) }
    else { sy = maxDim; sx = Math.round(maxDim * ratio) }
  }

  hiddenCanvas.width = sx
  hiddenCanvas.height = sy
  const hctx = hiddenCanvas.getContext('2d')
  hctx.clearRect(0, 0, sx, sy)
  hctx.drawImage(img, 0, 0, sx, sy)

  const bx = Math.ceil(sx / block), by = Math.ceil(sy / block)
  const colors = []
  const blocks = []
  const imgData = hctx.getImageData(0, 0, sx, sy).data

  for (let y = 0; y < by; y++) {
    for (let x = 0; x < bx; x++) {
      const sx0 = x * block, sy0 = y * block
      const sx1 = Math.min(sx, sx0 + block), sy1 = Math.min(sy, sy0 + block)
      let r = 0, g = 0, b = 0, count = 0
      if (mode === 'sample') {
        const step = Math.max(1, Math.floor(block / 3))
        for (let yy = sy0; yy < sy1; yy += step) {
          for (let xx = sx0; xx < sx1; xx += step) {
            const i = (yy * sx + xx) * 4
            r += imgData[i]; g += imgData[i + 1]; b += imgData[i + 2]; count++
          }
        }
      } else {
        for (let yy = sy0; yy < sy1; yy++) {
          for (let xx = sx0; xx < sx1; xx++) {
            const i = (yy * sx + xx) * 4
            r += imgData[i]; g += imgData[i + 1]; b += imgData[i + 2]; count++
          }
        }
      }
      if (count === 0) count = 1
      const avg = [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
      colors.push(avg)
      blocks.push({ x, y, color: avg })
    }
  }

  let palette = kmeans(colors, paletteSize, 14)
  palette = palette.map(c => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])])

  // Canvas reducido para descarga
  const pixelCanvas = document.createElement('canvas')
  pixelCanvas.width = bx
  pixelCanvas.height = by
  const pctx = pixelCanvas.getContext('2d')
  const outImg = pctx.createImageData(bx, by)
  for (let i = 0; i < blocks.length; i++) {
    const c = blocks[i].color
    let best = 0, bestd = Infinity
    for (let p = 0; p < palette.length; p++) {
      const d = rgbDist(c, palette[p])
      if (d < bestd) { bestd = d; best = p }
    }
    const col = palette[best]
    const px = i % bx
    const py = Math.floor(i / bx)
    const idx = (py * bx + px) * 4
    outImg.data[idx] = col[0]
    outImg.data[idx + 1] = col[1]
    outImg.data[idx + 2] = col[2]
    outImg.data[idx + 3] = 255
  }
  pctx.putImageData(outImg, 0, 0)


  // -------------------- FILTRO RETRO / CUSTOM --------------------
  const imgPixels = pctx.getImageData(0, 0, bx, by)
  const data = imgPixels.data
  const filter = filterSelect.value

  // Gradiente custom si es necesario
  let gradient = null
  if (filter === 'custom' && customColors.length >= 1) {
    const stops = customColors.slice()
    gradient = (t) => {
      if (stops.length === 1) return stops[0]
      const pos = t * (stops.length - 1)
      const i = Math.floor(pos)
      const frac = pos - i
      const a = stops[i]
      const b = stops[Math.min(i + 1, stops.length - 1)]
      return lerpColorRGB(a, b, frac)
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2]

    if (filter === 'gameboy') {
      const avg = (r + g + b) / 3
      r = avg * 0.6; g = avg * 0.85; b = avg * 0.5
    } else if (filter === 'nes') {
      const avg = (r + g + b) / 3
      r = avg * 1.2; g = avg * 0.5; b = avg * 0.4
    } else if (filter === 'cga') {
      r = r * 0.8 + b * 0.2
      g = g * 0.6 + b * 0.4
      b = b * 1.1
    } else if (filter === 'mono') {
      const avg = (r + g + b) / 3
      r = g = b = avg
    } else if (filter === 'custom' && gradient) {
      const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      const mapped = gradient(L)
      r = mapped[0]; g = mapped[1]; b = mapped[2]
    }

    data[i] = clamp(r, 0, 255)
    data[i + 1] = clamp(g, 0, 255)
    data[i + 2] = clamp(b, 0, 255)
  }
  pctx.putImageData(imgPixels, 0, 0)

  // Guardar este canvas para descarga "pixel art"
  lastPixelArtCanvas = pixelCanvas

  // Mostrar en grande
  const displayW = Math.min(900, bx * block)
  const displayH = Math.round(displayW * by / bx)
  outCanvas.width = displayW
  outCanvas.height = displayH
  const finalCtx = outCanvas.getContext('2d')
  finalCtx.imageSmoothingEnabled = false
  finalCtx.drawImage(pixelCanvas, 0, 0, displayW, displayH)

  downloadBtn.disabled = false
}

processBtn.addEventListener('click', processImage)

// -------------------- Descargar PNG --------------------
downloadBtn.addEventListener('click', () => {
  const mode = document.querySelector('input[name="downloadMode"]:checked').value
  let exportCanvas = null

  if (mode === 'pixel') {
    exportCanvas = lastPixelArtCanvas
  } else {
    // Redimensionar pixel art a tamaño original
    exportCanvas = document.createElement('canvas')
    exportCanvas.width = img.width
    exportCanvas.height = img.height
    const ctx = exportCanvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(lastPixelArtCanvas, 0, 0, img.width, img.height)
  }

  const a = document.createElement('a')
  a.href = exportCanvas.toDataURL('image/png')
  a.download = 'super-pixelate.png'
  a.click()
})

// -------------------- Reset --------------------
resetBtn.addEventListener('click', () => {
  fileInput.value = ''
  loaded = false
  const ctx = outCanvas.getContext('2d')
  ctx.clearRect(0, 0, outCanvas.width, outCanvas.height)
  downloadBtn.disabled = true
  customColors = []
  renderCustomList()
  lastPixelArtCanvas = null
})
