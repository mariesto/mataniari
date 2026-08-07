// Phase 3 API: live-preview session lifecycle.
const preview = require('../ghostty/preview.cjs')

module.exports = async function previewRoutes(fastify) {
  fastify.post('/api/preview/start', async (req) => preview.start(req.body && req.body.draft))
  fastify.post('/api/preview/update', async (req) =>
    preview.update(req.body && req.body.sessionId, req.body && req.body.draft),
  )
  fastify.post('/api/preview/commit', async (req) =>
    preview.commit(req.body && req.body.sessionId, req.body || {}),
  )
  fastify.post('/api/preview/cancel', async () => preview.cancel())
  fastify.get('/api/preview/status', async () => preview.status())
  fastify.post('/api/preview/resolve', async (req) => preview.resolveOrphaned(!!(req.body && req.body.keep)))
}
