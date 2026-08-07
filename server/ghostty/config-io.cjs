// Low-level config file primitives shared by preset-apply, override-commit, and preview.
// Every write path goes through here so backup/rotation behaves consistently.
const fs = require('fs')
const path = require('path')

const MAX_BACKUPS = 5
const BACKUP_SUFFIX = 'cadangan' // keeps the original naming: config.cadangan-<stamp>

function timestamp() {
  // Millisecond granularity so rapid successive applies don't collide onto one backup file.
  // Fixed width (YYYY-MM-DDTHH-MM-SS-mmm) keeps lexicographic sort == chronological.
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 23)
}

// Drop trailing blank lines (so re-writes don't accumulate empty lines).
function trimTrailingBlank(lines) {
  const out = lines.slice()
  while (out.length && out[out.length - 1].trim() === '') out.pop()
  return out
}

function readLines(configPath) {
  return fs.readFileSync(configPath, 'utf8').split('\n')
}

function writeLines(configPath, lines) {
  // Normalize to exactly one trailing newline.
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  fs.writeFileSync(configPath, lines.join('\n') + '\n')
}

// Copy the config to a timestamped backup, then keep only the newest MAX_BACKUPS.
function backupConfig(configPath) {
  const dir = path.dirname(configPath)
  const base = path.basename(configPath)
  const dest = path.join(dir, `${base}.${BACKUP_SUFFIX}-${timestamp()}`)
  fs.copyFileSync(configPath, dest)
  rotateBackups(configPath)
  return dest
}

function rotateBackups(configPath) {
  const dir = path.dirname(configPath)
  const prefix = `${path.basename(configPath)}.${BACKUP_SUFFIX}-`
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix))
    .sort() // timestamp names sort chronologically
  while (files.length > MAX_BACKUPS) {
    fs.unlinkSync(path.join(dir, files.shift()))
  }
}

// Drop every `theme = ...` line (used when replacing the managed theme).
function stripThemeLines(lines) {
  return lines.filter((l) => !/^theme\s*=/.test(l.trim()))
}

// Remove a sentinel-delimited managed block, inclusive of both markers. Idempotent.
function stripManagedBlock(lines, startMarker, endMarker) {
  const out = []
  let inside = false
  for (const line of lines) {
    const t = line.trim()
    if (t === startMarker) {
      inside = true
      continue
    }
    if (t === endMarker) {
      inside = false
      continue
    }
    if (!inside) out.push(line)
  }
  return out
}

module.exports = {
  MAX_BACKUPS,
  timestamp,
  trimTrailingBlank,
  readLines,
  writeLines,
  backupConfig,
  rotateBackups,
  stripThemeLines,
  stripManagedBlock,
}
