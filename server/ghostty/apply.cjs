// Commit a theme selection (single or light/dark split) into the user's real config.
// This is the Phase 1 "apply a preset" path; it reuses the config-io primitives so the
// override-commit path in later phases behaves identically.
const fs = require('fs')
const { resolveConfigPath } = require('./paths.cjs')
const {
  backupConfig,
  readLines,
  writeLines,
  stripThemeLines,
  trimTrailingBlank,
} = require('./config-io.cjs')
const { reload } = require('./reload.cjs')

const CONFIG_HEADER =
  '# Ghostty settings\n# The theme line below is managed by the Ghostty Theme Changer app.\n'

async function applyTheme(payload) {
  const { mode, theme, light, dark } = payload || {}
  let value
  if (mode === 'split') {
    if (!light || !dark) {
      return { ok: false, alasan: 'Both slots, the light one and the dark one, need to be filled first.' }
    }
    value = `light:${light},dark:${dark}`
  } else {
    if (!theme) return { ok: false, alasan: 'No theme has been picked yet.' }
    value = theme
  }

  try {
    const { path: configPath, dir, exists } = resolveConfigPath()
    fs.mkdirSync(dir, { recursive: true })
    if (!exists) {
      fs.writeFileSync(configPath, CONFIG_HEADER)
    } else {
      backupConfig(configPath)
    }

    const lines = trimTrailingBlank(stripThemeLines(readLines(configPath)))
    lines.push(`theme = ${value}`)
    writeLines(configPath, lines)

    await reload()
    return { ok: true, line: `theme = ${value}`, configPath }
  } catch {
    return {
      ok: false,
      alasan:
        "The settings file couldn't be written. Check the permissions on your Ghostty settings folder, then try again.",
    }
  }
}

module.exports = { applyTheme }
