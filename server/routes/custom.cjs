// Phase 2 API: create / read / edit / delete user theme files.
const custom = require('../ghostty/custom.cjs')

module.exports = async function customRoutes(fastify) {
  fastify.get('/api/custom-theme/:name', async (req, reply) => {
    const r = custom.readCustomThemeRaw(req.params.name)
    if (!r) return reply.code(404).send({ ok: false, alasan: 'Theme not found.' })
    return r
  })
  fastify.post('/api/custom-theme', async (req) =>
    custom.writeCustomTheme(req.body && req.body.name, (req.body && req.body.colors) || {}),
  )
  fastify.put('/api/custom-theme/:name', async (req) =>
    custom.editCustomTheme(req.params.name, (req.body && req.body.colors) || {}),
  )
  fastify.delete('/api/custom-theme/:name', async (req) => custom.deleteCustomTheme(req.params.name))
}
