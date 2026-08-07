// Serialize editor color drafts into Ghostty config text.
// Color shape (matches parseThemeFile + the UI theme card):
//   { background, foreground, cursor, selBg, selFg, palette: [16 hex] }
// Ghostty keys: background, foreground, cursor-color, selection-background,
//               selection-foreground, palette = N=#hex

// scalar key -> ghostty config key
const SCALAR_KEYS = [
  ['background', 'background'],
  ['foreground', 'foreground'],
  ['cursor', 'cursor-color'],
  ['selBg', 'selection-background'],
  ['selFg', 'selection-foreground'],
]

// Normalize "#abc" / "abc" / "#aabbcc" / "AABBCC" to lowercase "#aabbcc"; else null.
function normHex(v) {
  if (typeof v !== 'string') return null
  let h = v.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return '#' + h.toLowerCase()
}

function isHex(v) {
  return normHex(v) != null
}

// Full theme: every provided, valid color written explicitly.
function themeLines(colors) {
  const lines = []
  for (const [k, key] of SCALAR_KEYS) {
    const hx = normHex(colors && colors[k])
    if (hx) lines.push(`${key} = ${hx}`)
  }
  const pal = colors && Array.isArray(colors.palette) ? colors.palette : []
  for (let i = 0; i < 16; i++) {
    const hx = normHex(pal[i])
    if (hx) lines.push(`palette = ${i}=${hx}`)
  }
  return lines
}

// Override set: only the colors in `draft` that differ from `base`.
function overrideLines(base, draft) {
  const lines = []
  for (const [k, key] of SCALAR_KEYS) {
    const d = normHex(draft && draft[k])
    const b = normHex(base && base[k])
    if (d && d !== b) lines.push(`${key} = ${d}`)
  }
  const bp = (base && base.palette) || []
  const dp = (draft && draft.palette) || []
  for (let i = 0; i < 16; i++) {
    const d = normHex(dp[i])
    const b = normHex(bp[i])
    if (d && d !== b) lines.push(`palette = ${i}=${d}`)
  }
  return lines
}

module.exports = { SCALAR_KEYS, normHex, isHex, themeLines, overrideLines }
