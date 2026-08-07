// Talks to the local server that replaced Electron's IPC bridge.
// The per-launch token is injected into our HTML by the server (see server/index.cjs).
const TOKEN = typeof window !== 'undefined' ? window.__GTC_TOKEN__ : undefined

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      'x-gtc-token': TOKEN || '',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    throw new Error((data && data.alasan) || `Request failed: ${res.status}`)
  }
  return data
}

const enc = encodeURIComponent

export const api = {
  listThemes: () => call('/api/themes'),
  readState: () => call('/api/state'),
  applyTheme: (payload) => call('/api/theme', { method: 'POST', body: payload }),

  readCustomTheme: (name) => call(`/api/custom-theme/${enc(name)}`),
  saveCustomTheme: (name, colors) => call('/api/custom-theme', { method: 'POST', body: { name, colors } }),
  editCustomTheme: (name, colors) =>
    call(`/api/custom-theme/${enc(name)}`, { method: 'PUT', body: { colors } }),
  deleteCustomTheme: (name) => call(`/api/custom-theme/${enc(name)}`, { method: 'DELETE' }),

  previewStart: (draft) => call('/api/preview/start', { method: 'POST', body: { draft } }),
  previewUpdate: (sessionId, draft) =>
    call('/api/preview/update', { method: 'POST', body: { sessionId, draft } }),
  previewCommit: (sessionId, payload) =>
    call('/api/preview/commit', { method: 'POST', body: { sessionId, ...payload } }),
  previewCancel: (sessionId) => call('/api/preview/cancel', { method: 'POST', body: { sessionId } }),
  previewStatus: () => call('/api/preview/status'),
  previewResolve: (keep) => call('/api/preview/resolve', { method: 'POST', body: { keep } }),
}
