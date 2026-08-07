// Font settings: enumerate available families via `ghostty +list-fonts`, and write
// font-family / font-size into the config (global keys, not part of a theme).
const { execFile } = require('child_process')
const fs = require('fs')
const { resolveConfigPath } = require('./paths.cjs')
const { backupConfig, readLines, writeLines, trimTrailingBlank } = require('./config-io.cjs')
const { reload } = require('./reload.cjs')

const CONFIG_HEADER =
  '# Ghostty settings\n# Managed in part by the Ghostty Theme Changer app.\n'

// `ghostty` is often not on PATH for a GUI-launched server; prefer the app binary.
function ghosttyBin() {
  if (process.env.GHOSTTY_BIN) return process.env.GHOSTTY_BIN
  const mac = '/Applications/Ghostty.app/Contents/MacOS/ghostty'
  try {
    if (fs.statSync(mac).isFile()) return mac
  } catch {
    /* not macOS / not there */
  }
  return 'ghostty'
}

// Parse `+list-fonts`: family names are flush-left, styles are indented, blank line between.
function listFonts() {
  return new Promise((resolve) => {
    execFile(ghosttyBin(), ['+list-fonts'], { maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) return resolve([])
      const families = []
      for (const line of stdout.split('\n')) {
        if (!line.trim()) continue
        if (/^\s/.test(line)) continue // indented = a style variant
        families.push(line.trim())
      }
      resolve([...new Set(families)].sort((a, b) => a.localeCompare(b)))
    })
  })
}

async function applyFont({ family, size } = {}) {
  try {
    const { path: configPath, dir, exists } = resolveConfigPath()
    fs.mkdirSync(dir, { recursive: true })
    if (!exists) fs.writeFileSync(configPath, CONFIG_HEADER)
    else backupConfig(configPath)

    // Replace the PRIMARY font-family (leaves font-family-bold/italic etc. alone) and font-size.
    let lines = readLines(configPath).filter(
      (l) => !/^font-family\s*=/.test(l.trim()) && !/^font-size\s*=/.test(l.trim()),
    )
    lines = trimTrailingBlank(lines)
    if (typeof family === 'string' && family.trim()) {
      lines.push(`font-family = "${family.trim()}"`)
    }
    const n = Number(size)
    if (Number.isFinite(n) && n > 0) {
      lines.push(`font-size = ${n}`)
    }
    writeLines(configPath, lines)

    await reload()
    return { ok: true, configPath }
  } catch {
    return {
      ok: false,
      alasan: "Couldn't write your font settings. Check the permissions on your Ghostty config folder.",
    }
  }
}

module.exports = { ghosttyBin, listFonts, applyFont }
