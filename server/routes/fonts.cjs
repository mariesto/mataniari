// Font settings API: list available families, apply family/size.
const { listFonts, applyFont } = require('../ghostty/fonts.cjs')

module.exports = async function fontRoutes(fastify) {
  fastify.get('/api/fonts', async () => ({ fonts: await listFonts() }))
  fastify.post('/api/font', async (req) => applyFont(req.body || {}))
}
