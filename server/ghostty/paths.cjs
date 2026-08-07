// Platform-aware resolution of the Ghostty config file + theme directories.
//
// macOS reads BOTH ~/Library/Application Support/com.mitchellh.ghostty/config AND the
// XDG ~/.config/ghostty/config. The Application Support file loads last, so it WINS on
// conflict. We therefore edit the highest-precedence file that already exists, and only
// fall back to the XDG path when creating a fresh config. Linux uses XDG only.
const path = require('path')
const fs = require('fs')
const os = require('os')

const HOME = os.homedir()
const isMac = process.platform === 'darwin'

const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(HOME, '.config')
const XDG_GHOSTTY_DIR = path.join(XDG_CONFIG_HOME, 'ghostty')
const MAC_APPSUPPORT_DIR = path.join(HOME, 'Library', 'Application Support', 'com.mitchellh.ghostty')

// Config file candidates, ordered LOW -> HIGH precedence (later wins, matching Ghostty's load order).
function configCandidates() {
  const list = [
    path.join(XDG_GHOSTTY_DIR, 'config'),
    path.join(XDG_GHOSTTY_DIR, 'config.ghostty'),
  ]
  if (isMac) {
    list.push(
      path.join(MAC_APPSUPPORT_DIR, 'config'),
      path.join(MAC_APPSUPPORT_DIR, 'config.ghostty'),
    )
  }
  return list
}

// The file we should READ / EDIT: the highest-precedence candidate that exists.
// When none exist yet, the default creation path (XDG config).
function resolveConfigPath() {
  let chosen = null
  for (const p of configCandidates()) {
    try {
      if (fs.statSync(p).isFile()) chosen = p // keep the last existing = highest precedence
    } catch {
      /* not present */
    }
  }
  const configPath = chosen || path.join(XDG_GHOSTTY_DIR, 'config')
  return { path: configPath, dir: path.dirname(configPath), exists: chosen != null }
}

function builtinThemesDir() {
  if (process.env.GHOSTTY_RESOURCES_DIR) {
    return path.join(process.env.GHOSTTY_RESOURCES_DIR, 'themes')
  }
  if (isMac) return '/Applications/Ghostty.app/Contents/Resources/ghostty/themes'
  return '/usr/share/ghostty/themes'
}

// Directories that may hold user themes, LOW -> HIGH precedence (later wins on name clash).
function userThemesDirs() {
  const dirs = [path.join(XDG_GHOSTTY_DIR, 'themes')]
  if (isMac) dirs.push(path.join(MAC_APPSUPPORT_DIR, 'themes'))
  return dirs
}

// Where NEW custom themes are written: the themes dir next to the active config.
function primaryUserThemesDir() {
  return path.join(resolveConfigPath().dir, 'themes')
}

module.exports = {
  HOME,
  isMac,
  XDG_GHOSTTY_DIR,
  MAC_APPSUPPORT_DIR,
  configCandidates,
  resolveConfigPath,
  builtinThemesDir,
  userThemesDirs,
  primaryUserThemesDir,
}
