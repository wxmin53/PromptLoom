require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const https = require('https')
const config = require('./config')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const API_KEY = process.env.ANTHROPIC_API_KEY

function getProviderConfig() {
  const modelId = config.model
  const providerConfig = config.providers[modelId]
  if (!providerConfig) throw new Error(`Unknown model: ${modelId}`)
  const apiKey = process.env[providerConfig.apiKeyEnv]
  return { modelId, ...providerConfig, apiKey }
}

function buildRequestBody(body, stream = false) {
  const { modelId, provider } = getProviderConfig()

  if (provider === 'anthropic') {
    return stream ? { ...body, stream: true } : { ...body }
  }

  // OpenAI 兼容格式：system 字段转为 messages 首条
  const { system, messages, max_tokens, ...rest } = body
  const openaiMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages
  const openaiBody = { ...rest, model: modelId, messages: openaiMessages, max_tokens }
  return stream ? { ...openaiBody, stream: true } : openaiBody
}

function buildHeaders(bodyStr) {
  const { provider, apiKey } = getProviderConfig()
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyStr),
  }
  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  return headers
}

function parseNonStreamResponse(data) {
  const { provider } = getProviderConfig()
  if (provider === 'anthropic') {
    return data.content?.[0]?.text ?? ''
  }
  return data.choices?.[0]?.message?.content ?? ''
}

app.post('/api/messages', (req, res) => {
  const { apiKey } = getProviderConfig()
  if (!apiKey) {
    return res.status(500).json({ error: 'API_KEY not configured' })
  }

  const { hostname, path } = getProviderConfig()
  const bodyStr = JSON.stringify(buildRequestBody(req.body))
  const headers = buildHeaders(bodyStr)

  const options = { hostname, path, method: 'POST', timeout: 90000, headers }

  let rawData = ''
  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode)
    res.setHeader('Content-Type', 'application/json')
    proxyRes.on('data', (chunk) => { rawData += chunk })
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(rawData)
        const { provider } = getProviderConfig()
        if (provider === 'anthropic') {
          res.end(rawData)
        } else {
          // 将 OpenAI 格式转换为前端期望的 Anthropic 格式
          const text = parseNonStreamResponse(parsed)
          res.end(JSON.stringify({ content: [{ type: 'text', text }] }))
        }
      } catch {
        res.end(rawData)
      }
    })
  })

  proxyReq.on('timeout', () => {
    proxyReq.destroy()
    if (!res.headersSent) {
      res.status(504).json({ error: { message: '请求超时，请稍后重试' } })
    }
  })

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(502).json({ error: { message: err.message } })
    }
  })

  proxyReq.write(bodyStr)
  proxyReq.end()
})

app.post('/api/messages/stream', (req, res) => {
  const { apiKey } = getProviderConfig()
  if (!apiKey) {
    return res.status(500).json({ error: 'API_KEY not configured' })
  }

  const { hostname, path } = getProviderConfig()
  const bodyStr = JSON.stringify(buildRequestBody(req.body, true))
  const headers = buildHeaders(bodyStr)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const options = { hostname, path, method: 'POST', headers }

  const proxyReq = https.request(options, (proxyRes) => {
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    if (!res.headersSent) res.status(502).json({ error: { message: err.message } })
    else res.end()
  })

  proxyReq.write(bodyStr)
  proxyReq.end()
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`)
  console.log(`Using model: ${config.model} (${getProviderConfig().provider})`)
})
