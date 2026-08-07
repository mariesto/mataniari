// The single, swappable "tell Ghostty to re-read its config" trigger.
//
// Ghostty >= 1.2.0 reloads on SIGUSR2 on BOTH macOS (DispatchSource) and Linux (GLib).
// We find the process precisely by its executable basename and signal it with process.kill,
// rather than `pkill -x ghostty` — on macOS the process "name" is the full app path
// (/Applications/Ghostty.app/Contents/MacOS/ghostty), so an exact-name pkill matches nothing.
const { execFile } = require('child_process')

// Return the PIDs of running Ghostty processes (executable basename === "ghostty").
function findGhosttyPids() {
  return new Promise((resolve) => {
    execFile('ps', ['-axo', 'pid=,comm='], (err, stdout) => {
      if (err || !stdout) return resolve([])
      const pids = []
      for (const line of stdout.split('\n')) {
        const m = line.trim().match(/^(\d+)\s+(.*)$/)
        if (!m) continue
        const base = m[2].split('/').pop() // full path -> "ghostty" (macOS); short name on Linux
        if (base === 'ghostty') pids.push(Number(m[1]))
      }
      resolve(pids)
    })
  })
}

async function reload() {
  // Escape hatch for tests / headless runs: never signal a real terminal.
  if (process.env.GTC_NO_RELOAD) return false
  const pids = await findGhosttyPids()
  let sent = 0
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGUSR2')
      sent++
    } catch {
      /* process gone or not permitted */
    }
  }
  return sent > 0
}

async function isGhosttyRunning() {
  return (await findGhosttyPids()).length > 0
}

module.exports = { reload, isGhosttyRunning, findGhosttyPids }
