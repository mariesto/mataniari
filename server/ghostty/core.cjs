// Read-only Ghostty knowledge: enumerate themes, read current state, parse theme files.
// Ported from the original electron/ghostty.cjs (pure Node), now using platform-aware paths.
const path = require('path')
const fs = require('fs')
const { builtinThemesDir, userThemesDirs, resolveConfigPath } = require('./paths.cjs')

// ---------- color utils ----------
function hexToRgb(hex) {
  let h = String(hex).replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return [0, 0, 0]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// ---------- theme file parser ----------
function parseThemeFile(file) {
  const t = {
    background: null,
    foreground: null,
    cursor: null,
    selBg: null,
    selFg: null,
    palette: Array(16).fill(null),
  }
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    return null
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    let m = line.match(/^palette\s*=\s*(\d{1,2})\s*=\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/)
    if (m) {
      const idx = Number(m[1])
      if (idx >= 0 && idx <= 15) t.palette[idx] = m[2]
      continue
    }
    m = line.match(
      /^(background|foreground|cursor-color|selection-background|selection-foreground)\s*=\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/,
    )
    if (m) {
      if (m[1] === 'background') t.background = m[2]
      if (m[1] === 'foreground') t.foreground = m[2]
      if (m[1] === 'cursor-color') t.cursor = m[2]
      if (m[1] === 'selection-background') t.selBg = m[2]
      if (m[1] === 'selection-foreground') t.selFg = m[2]
    }
  }
  return t
}

// Build the UI-facing theme object, filling missing palette slots so previews stay intact.
function toThemeCard(name, source, t) {
  const pal = t.palette.map((c, i) => c || (i < 8 ? t.background : t.foreground))
  return {
    name,
    source,
    background: t.background,
    foreground: t.foreground || (luminance(t.background) > 0.4 ? '#1a1a1a' : '#e6e6e6'),
    cursor: t.cursor || t.foreground || '#ffffff',
    selBg: t.selBg || t.foreground || '#888888',
    selFg: t.selFg || t.background || '#000000',
    palette: pal,
    light: luminance(t.background) > 0.4,
  }
}

function collectThemes() {
  const byName = new Map()
  const readDir = (dir, source) => {
    if (!fs.existsSync(dir)) return
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name)
      try {
        if (!fs.statSync(file).isFile()) continue
      } catch {
        continue
      }
      const t = parseThemeFile(file)
      if (!t || !t.background) continue
      byName.set(name, toThemeCard(name, source, t))
    }
  }
  readDir(builtinThemesDir(), 'bawaan')
  for (const dir of userThemesDirs()) readDir(dir, 'buatan') // user themes win on name clash
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

// ---------- current state ----------
function parseThemeLine(value) {
  // "light:A,dark:B" or "Theme Name"
  const res = { mode: 'single', theme: null, light: null, dark: null }
  if (!value) return res
  if (/(^|,)\s*(light|dark)\s*:/.test(value)) {
    res.mode = 'split'
    for (const part of value.split(',')) {
      const m = part.trim().match(/^(light|dark)\s*:\s*(.+)$/)
      if (m) res[m[1]] = m[2].trim()
    }
    return res
  }
  res.theme = value.trim()
  return res
}

// Current primary font-family + font-size from the config (defaults left to the UI).
function parseFont(text) {
  let family = null
  let size = null
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const mf = line.match(/^font-family\s*=\s*(.+)$/)
    if (mf) {
      const v = mf[1].trim().replace(/^["']|["']$/g, '')
      if (v && !family) family = v // first non-empty = primary
    }
    const ms = line.match(/^font-size\s*=\s*([\d.]+)/)
    if (ms) size = Number(ms[1]) // last one wins
  }
  return { family, size }
}

function readState() {
  const { path: configPath, exists } = resolveConfigPath()
  const noFont = { family: null, size: null }
  if (!exists) {
    return { configExists: false, current: parseThemeLine(null), font: noFont, configPath }
  }
  let text = ''
  try {
    text = fs.readFileSync(configPath, 'utf8')
  } catch {
    return { configExists: true, current: parseThemeLine(null), font: noFont, configPath }
  }
  let value = null
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (/^theme\s*=/.test(line)) value = line.replace(/^theme\s*=\s*/, '')
  }
  return { configExists: true, current: parseThemeLine(value), font: parseFont(text), configPath }
}

module.exports = {
  hexToRgb,
  luminance,
  parseThemeFile,
  toThemeCard,
  collectThemes,
  parseThemeLine,
  readState,
}
