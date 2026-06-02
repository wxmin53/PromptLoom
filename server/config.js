module.exports = {
  // ─── 切换模型：按功能分别配置 ────────────────────────────────────────────
  // Claude 系列：'claude-sonnet-4-6' | 'claude-opus-4-7'
  // Qwen 系列：  'qwen-max' | 'qwen-plus' | 'qwen3-235b-a22b'
  models: {
    prompt: 'claude-sonnet-4-6',  // 提示词生成 Tab
    chat: 'claude-sonnet-4-6',    // AI 对话 Tab（可独立切换）
  },
  // ──────────────────────────────────────────────────────────────────────────

  providers: {
    // ── Anthropic Claude 系列 ──────────────────────────────────────────────
    // API Key 配置在 server/.env 的 ANTHROPIC_API_KEY
    'claude-sonnet-4-6': {
      provider: 'anthropic',
      apiKeyEnv: 'ANTHROPIC_API_KEY',   // 读取 .env 中的哪个变量
      hostname: 'api.ikuncode.cc',       // API 域名（当前为第三方中转）
      path: '/v1/messages',              // API 路径
    },
    'claude-opus-4-7': {
      provider: 'anthropic',
      apiKeyEnv: 'ANTHROPIC_API_KEY',
      hostname: 'api.ikuncode.cc',
      path: '/v1/messages',
    },

    // ── Qwen 系列（OpenAI 兼容格式）──────────────────────────────────────
    // API Key 配置在 server/.env 的 QWEN_API_KEY
    // 如使用公司自建部署，修改对应条目的 hostname 和 path
    'qwen-max': {
      provider: 'openai',
      apiKeyEnv: 'QWEN_API_KEY',         // 读取 .env 中的哪个变量
      hostname: 'dashscope.aliyuncs.com', // API 域名
      path: '/compatible-mode/v1/chat/completions', // API 路径
    },
    'qwen-plus': {
      provider: 'openai',
      apiKeyEnv: 'QWEN_API_KEY',
      hostname: 'dashscope.aliyuncs.com',
      path: '/compatible-mode/v1/chat/completions',
    },
    'qwen3-235b-a22b': {
      provider: 'openai',
      apiKeyEnv: 'QWEN_API_KEY',
      hostname: 'dashscope.aliyuncs.com',
      path: '/compatible-mode/v1/chat/completions',
    },
  },
}
