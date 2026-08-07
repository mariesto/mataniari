// Phase 1 API: list themes, read current state, apply a preset (single or light/dark split).
const core = require('../ghostty/core.cjs')
const { applyTheme } = require('../ghostty/apply.cjs')

module.exports = async function themesRoutes(fastify) {
  fastify.get('/api/themes', async () => core.collectThemes())
  fastify.get('/api/state', async () => core.readState())
  fastify.post('/api/theme', async (req) => applyTheme(req.body || {}))
}
