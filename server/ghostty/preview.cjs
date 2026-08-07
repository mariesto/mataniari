// Live-preview session: push editor changes to the user's REAL Ghostty windows without
// churning their config. We add ONE sentinel-wrapped optional include to the main config
// (once), then only ever rewrite our own preview file. Cancel/commit removes the include.
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { resolveConfigPath } = require('./paths.cjs')
const {
  readLines,
  writeLines,
  backupConfig,
  stripThemeLines,
  stripManagedBlock,
  trimTrailingBlank,
  timestamp,
} = require('./config-io.cjs')
const { themeLines, overrideLines } = require('./overrides.cjs')
const { writeCustomTheme } = require('./custom.cjs')
const { parseThemeFile } = require('./core.cjs')
const { reload } = require('./reload.cjs')

const START = '# >>> ghostty-theme-changer preview (managed) >>>'
const END = '# <<< ghostty-theme-changer preview (managed) <<<'
const PREVIEW_FILE = 'themechanger-preview.ghostty'
const HEADER = '# Ghostty settings\n# Managed in part by the Ghostty Theme Changer app.\n'

let session = null // { id, snapshotPath }

function newId() {
  return crypto.randomBytes(8).toString('hex')
}

function hasBlock(lines) {
  return lines.some((l) => l.trim() === START)
}

function ensureConfig() {
  const c = resolveConfigPath()
  fs.mkdirSync(c.dir, { recursive: true })
  if (!c.exists) fs.writeFileSync(c.path, HEADER)
  return resolveConfigPath()
}

function ensureInclude(configPath) {
  let lines = trimTrailingBlank(stripManagedBlock(readLines(configPath), START, END))
  lines.push(START, `config-file = ?${PREVIEW_FILE}`, END)
  writeLines(configPath, lines)
}

function removeInclude(configPath) {
  writeLines(configPath, stripManagedBlock(readLines(configPath), START, END))
}

function writePreview(dir, draft) {
  const body = ['# Live preview — Ghostty Theme Changer', ...themeLines(draft || {})].join('\n') + '\n'
  fs.writeFileSync(path.join(dir, PREVIEW_FILE), body)
}

function deletePreview(dir) {
  try {
    fs.unlinkSync(path.join(dir, PREVIEW_FILE))
  } catch {
    /* already gone */
  }
}

function readPreviewColors(dir) {
  try {
    return parseThemeFile(path.join(dir, PREVIEW_FILE))
  } catch {
    return null
  }
}

// --- trailing reload throttle: at most one reload per RELOAD_MIN_MS during rapid updates ---
const RELOAD_MIN_MS = 120
let reloadTimer = null
let reloadPending = false
function scheduleReload() {
  if (reloadTimer) {
    reloadPending = true
    return
  }
  reload()
  reloadTimer = setTimeout(() => {
    reloadTimer = null
    if (reloadPending) {
      reloadPending = false
      scheduleReload()
    }
  }, RELOAD_MIN_MS)
}

async function start(draft) {
  const c = ensureConfig()
  const snapshotPath = `${c.path}.themechanger-session-${timestamp()}`
  try {
    fs.copyFileSync(c.path, snapshotPath)
  } catch {
    /* best effort */
  }
  ensureInclude(c.path)
  writePreview(c.dir, draft)
  session = { id: newId(), snapshotPath }
  await reload()
  return { ok: true, sessionId: session.id }
}

function update(id, draft) {
  if (!session || session.id !== id) return { ok: false, alasan: 'No active preview session.' }
  const c = resolveConfigPath()
  writePreview(c.dir, draft)
  scheduleReload()
  return { ok: true }
}

async function cancel() {
  // Idempotent: also cleans an orphaned block. We only ever ADDED an optional include,
  // so removing it returns the config to exactly its prior committed state.
  const c = resolveConfigPath()
  if (c.exists) removeInclude(c.path)
  deletePreview(c.dir)
  session = null
  await reload()
  return { ok: true }
}

async function commit(id, payload) {
  const { mode, name, base, baseColors, draft } = payload || {}
  const c = ensureConfig()

  let themeValue
  if (mode === 'saveAs') {
    const r = writeCustomTheme(name, draft)
    if (!r.ok) return r
    themeValue = name
  }

  if (c.exists) backupConfig(c.path)
  let lines = trimTrailingBlank(stripThemeLines(stripManagedBlock(readLines(c.path), START, END)))
  if (mode === 'saveAs') {
    lines.push(`theme = ${themeValue}`)
  } else {
    // Bake the draft as overrides layered on the base preset.
    if (base) lines.push(`theme = ${base}`)
    for (const l of overrideLines(baseColors || {}, draft || {})) lines.push(l)
  }
  writeLines(c.path, lines)
  deletePreview(c.dir)
  session = null
  await reload()
  return { ok: true, configPath: c.path }
}

function status() {
  const c = resolveConfigPath()
  const lines = c.exists ? readLines(c.path) : []
  const block = hasBlock(lines)
  return {
    active: !!session,
    sessionId: session ? session.id : null,
    orphaned: block && !session, // block left over from a crashed session
    previewColors: block ? readPreviewColors(c.dir) : null,
  }
}

// Resolve an orphaned preview left by a crash: keep = bake the preview colors into the
// config; discard = drop the include and delete the preview file.
async function resolveOrphaned(keep) {
  const c = resolveConfigPath()
  if (!c.exists) {
    session = null
    return { ok: true }
  }
  if (keep) {
    const colors = readPreviewColors(c.dir)
    backupConfig(c.path)
    const lines = trimTrailingBlank(stripThemeLines(stripManagedBlock(readLines(c.path), START, END)))
    if (colors) for (const l of themeLines(colors)) lines.push(l)
    writeLines(c.path, lines)
  } else {
    removeInclude(c.path)
  }
  deletePreview(c.dir)
  session = null
  await reload()
  return { ok: true }
}

module.exports = { start, update, cancel, commit, status, resolveOrphaned, START, END, PREVIEW_FILE }
