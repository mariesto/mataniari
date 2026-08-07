// Ghostty Theme Changer — local web server.
// Replaces the old Electron main process: serves the built React UI to the user's own
// browser and exposes a small JSON API. No Chromium is bundled.
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const Fastify = require('fastify')
const fastifyStatic = require('@fastify/static')

const DIST = path.join(__dirname, '..', 'dist')
const DEFAULT_PORT = Number(process.env.GTC_PORT || 4177)
const HOST = '127.0.0.1'
// In dev, Vite serves the UI on its own port and proxies /api here; that HTML has no token,
// so we relax the token check (still bound to 127.0.0.1). Set by the `dev` npm script.
const DEV = !!process.env.GTC_DEV
// Per-launch secret: injected into our served HTML and required back on every /api call.
// A cross-origin page can't read our HTML (same-origin policy), so it can't forge the token.
const TOKEN = crypto.randomBytes(24).toString('hex')

const themesRoutes = require('./routes/themes.cjs')
const customRoutes = require('./routes/custom.cjs')
const previewRoutes = require('./routes/preview.cjs')
const fontRoutes = require('./routes/fonts.cjs')

function isLocalHost(hostHeader) {
  if (!hostHeader) return false
  const h = hostHeader.split(':')[0].replace(/^\[|\]$/g, '')
  return h === '127.0.0.1' || h === 'localhost' || h === '::1'
}

async function build() {
  const distBuilt = fs.existsSync(path.join(DIST, 'index.html'))
  const app = Fastify({ logger: false })

  // Guard the API: same-origin host + valid launch token. Blocks DNS-rebinding / CSRF
  // from any other page the user might have open in the same browser.
  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api')) return
    if (!isLocalHost(req.headers.host)) {
      return reply.code(403).send({ ok: false, alasan: 'Forbidden host.' })
    }
    if (!DEV && req.headers['x-gtc-token'] !== TOKEN) {
      return reply.code(403).send({ ok: false, alasan: 'Missing or invalid token.' })
    }
  })

  await app.register(themesRoutes)
  await app.register(customRoutes)
  await app.register(previewRoutes)
  await app.register(fontRoutes)

  if (distBuilt) {
    // Static assets (JS/CSS/fonts). index:false so we can inject the token into index.html.
    await app.register(fastifyStatic, { root: DIST, index: false })
    const serveIndex = (_req, reply) => {
      const html = fs
        .readFileSync(path.join(DIST, 'index.html'), 'utf8')
        .replace('</head>', `<script>window.__GTC_TOKEN__=${JSON.stringify(TOKEN)}</script></head>`)
      reply.type('text/html').send(html)
    }
    app.get('/', serveIndex)
    app.get('/index.html', serveIndex)
  }

  return { app, distBuilt }
}

async function listenWithFallback(app, startPort, attempts = 20) {
  for (let p = startPort; p < startPort + attempts; p++) {
    try {
      await app.listen({ host: HOST, port: p })
      return p
    } catch (e) {
      if (e && e.code === 'EADDRINUSE') continue
      throw e
    }
  }
  throw new Error(`No free port in ${startPort}..${startPort + attempts - 1}`)
}

async function main() {
  const { app, distBuilt } = await build()
  const port = await listenWithFallback(app, DEFAULT_PORT)
  const url = `http://${HOST}:${port}`

  if (!distBuilt) {
    console.log(`[gtc] API server on ${url} (dev / API-only — no dist yet). UI: run \`vite\`.`)
    return
  }

  console.log(`[gtc] Ghostty Theme Changer running at ${url}`)
  if (!process.env.GTC_NO_OPEN) {
    try {
      const open = (await import('open')).default
      await open(url)
    } catch {
      console.log('[gtc] Open the URL above in your browser.')
    }
  }
}

main().catch((e) => {
  console.error('[gtc] failed to start:', e)
  process.exit(1)
})
