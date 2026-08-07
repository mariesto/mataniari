// Create / edit / read / delete user theme files in the Ghostty themes directory.
const fs = require('fs')
const path = require('path')
const { primaryUserThemesDir, userThemesDirs } = require('./paths.cjs')
const { parseThemeFile } = require('./core.cjs')
const { themeLines } = require('./overrides.cjs')
const { timestamp } = require('./config-io.cjs')

const BACKUP_SUBDIR = '.gtc-backups' // a dir, so collectThemes (files only) ignores it

// Ghostty theme files are named after the theme with no extension. Keep names safe:
// no separators, no traversal, no leading dot, printable label characters only.
function safeName(name) {
  if (typeof name !== 'string') return null
  const n = name.trim()
  if (!n || n.length > 100) return null
  if (n.includes('/') || n.includes('\\') || n.includes('..')) return null
  if (n.startsWith('.')) return null
  if (!/^[\w .+()#'&\-]+$/.test(n)) return null
  return n
}

function findExisting(name) {
  for (const dir of userThemesDirs()) {
    const p = path.join(dir, name)
    try {
      if (fs.statSync(p).isFile()) return p
    } catch {
      /* not here */
    }
  }
  return null
}

function serialize(headerComment, colors) {
  return [`# ${headerComment}`, ...themeLines(colors)].join('\n') + '\n'
}

function backupThemeFile(filePath) {
  const dir = path.join(path.dirname(filePath), BACKUP_SUBDIR)
  try {
    fs.mkdirSync(dir, { recursive: true })
    fs.copyFileSync(filePath, path.join(dir, `${path.basename(filePath)}.${timestamp()}`))
  } catch {
    /* best effort */
  }
}

function writeCustomTheme(name, colors) {
  const n = safeName(name)
  if (!n) return { ok: false, alasan: 'That name has characters that aren’t allowed in a theme file.' }
  if (findExisting(n)) {
    return { ok: false, alasan: 'A theme with that name already exists — pick another name or edit it.' }
  }
  const dir = primaryUserThemesDir()
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, n)
  fs.writeFileSync(filePath, serialize('Created by Ghostty Theme Changer', colors))
  return { ok: true, name: n, path: filePath }
}

function editCustomTheme(name, colors) {
  const n = safeName(name)
  if (!n) return { ok: false, alasan: 'Invalid theme name.' }
  const existing = findExisting(n)
  if (!existing) return { ok: false, alasan: 'That theme doesn’t exist yet.' }
  backupThemeFile(existing)
  fs.writeFileSync(existing, serialize('Edited by Ghostty Theme Changer', colors))
  return { ok: true, name: n, path: existing }
}

function readCustomThemeRaw(name) {
  const n = safeName(name)
  if (!n) return null
  const existing = findExisting(n)
  if (!existing) return null
  const t = parseThemeFile(existing) // nulls preserved for unset colors
  return t ? { name: n, colors: t, path: existing } : null
}

function deleteCustomTheme(name) {
  const n = safeName(name)
  if (!n) return { ok: false, alasan: 'Invalid theme name.' }
  const existing = findExisting(n) // only ever resolves inside user theme dirs
  if (!existing) return { ok: false, alasan: 'Theme not found.' }
  backupThemeFile(existing)
  fs.unlinkSync(existing)
  return { ok: true, name: n }
}

module.exports = {
  safeName,
  writeCustomTheme,
  editCustomTheme,
  readCustomThemeRaw,
  deleteCustomTheme,
}
