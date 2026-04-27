require('dotenv').config()
const express = require('express')
const cors = require('cors')
const https = require('https')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const API_KEY = process.env.ANTHROPIC_API_KEY

app.post('/api/messages', (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const body = JSON.stringify(req.body)

  const options = {
    hostname: 'api.ikuncode.cc',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body),
    },
  }

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode)
    res.setHeader('Content-Type', 'application/json')
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    res.status(502).json({ error: err.message })
  })

  proxyReq.write(body)
  proxyReq.end()
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`)
})
