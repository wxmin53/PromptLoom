# PromptLoom 部署文档

## 一、项目结构

```
PromptLoom/
├── server/                  # Node.js 代理服务器（独立进程）
│   ├── index.js             # 服务入口，监听 3001 端口
│   ├── config.js            # 模型与 API 提供商配置
│   ├── .env                 # API Key（不提交 git，需手动创建）
│   ├── .env.example         # 环境变量模板
│   └── package.json         # 服务端依赖（express / cors / dotenv）
├── src/                     # 前端源码（React + TypeScript）
├── dist/                    # 前端构建产物（npm run build 生成）
├── package.json             # 前端依赖与构建脚本
└── vite.config.ts           # Vite 配置（开发代理）
```

**运行时由两个独立进程组成：**

| 进程 | 端口 | 职责 |
|---|---|---|
| Node.js 代理服务器 | 3001 | 持有 API Key，转发大模型请求 |
| 前端静态文件（Nginx） | 80 / 443 | 提供 HTML/JS/CSS，反向代理 /api/* |

---

## 二、运维配置项

### 1. API Key 配置

文件路径：`server/.env`（参考 `server/.env.example` 创建）

```env
# Claude 系列（Anthropic）
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Qwen 系列（阿里云 DashScope）
QWEN_API_KEY=your_qwen_api_key_here

# 代理服务器端口（可选，默认 3001）
PORT=3001
```

API Key 仅由代理服务器读取，前端不持有该值。

### 2. 模型与 API 地址配置

文件路径：`server/config.js`

```js
module.exports = {
  model: 'claude-sonnet-4-6',   // 修改此字段切换当前使用的模型

  providers: {
    'claude-sonnet-4-6': {
      provider: 'anthropic',
      apiKeyEnv: 'ANTHROPIC_API_KEY',
      hostname: 'api.anthropic.com',   // 官方地址，或替换为中转地址
      path: '/v1/messages',
    },
    'qwen-max': {
      provider: 'openai',
      apiKeyEnv: 'QWEN_API_KEY',
      hostname: 'dashscope.aliyuncs.com',
      path: '/compatible-mode/v1/chat/completions',
    },
    // 新增模型：在此添加条目，无需改其他文件
  }
}
```

**接入公司自建大模型：** 在 `providers` 中新增条目，设置 `hostname` 和 `path`，将 `provider` 设为 `'anthropic'`（原生格式）或 `'openai'`（OpenAI 兼容格式），然后修改 `model` 字段激活。

### 3. 端口配置

代理服务器默认监听 **3001** 端口，通过 `server/.env` 中的 `PORT` 变量覆盖。Nginx 反向代理配置需与此端口保持一致。

---

## 三、部署步骤

### 前提条件

- Node.js >= 18
- npm >= 9
- Nginx（用于静态文件服务和反向代理）
- PM2（推荐，用于进程管理）

### 第一步：获取代码

```bash
git clone git@github.com:wxmin53/PromptLoom.git /opt/promptloom
cd /opt/promptloom
```

### 第二步：配置环境变量

```bash
cp server/.env.example server/.env
# 编辑 server/.env，填入真实的 API Key
vim server/.env
```

### 第三步：安装依赖并构建前端

```bash
# 安装前端依赖并构建
npm install
npm run build
# 产物输出到 dist/ 目录

# 安装服务端依赖
cd server && npm install && cd ..
```

### 第四步：启动代理服务器

**使用 PM2（推荐）：**

```bash
# 安装 PM2（如未安装）
npm install -g pm2

# 启动服务
pm2 start server/index.js --name promptloom-server

# 设置开机自启
pm2 save
pm2 startup
```

**使用 systemd：**

创建 `/etc/systemd/system/promptloom.service`：

```ini
[Unit]
Description=PromptLoom Proxy Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/promptloom/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable promptloom
systemctl start promptloom
```

### 第五步：配置 Nginx

**HTTP 配置（`/etc/nginx/sites-available/promptloom`）：**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /opt/promptloom/dist;
    index index.html;

    # SPA 路由（所有非文件请求回退到 index.html）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 请求转发到 Node.js 代理服务器
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        # SSE 流式输出必须关闭缓冲，否则内容会在最后一次性出现
        proxy_buffering off;
        proxy_cache off;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/promptloom /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**HTTPS 配置（使用 Certbot）：**

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx

# 申请证书（自动修改 Nginx 配置）
certbot --nginx -d your-domain.com

# 证书自动续期（Certbot 安装时已配置 cron，验证即可）
certbot renew --dry-run
```

---

## 四、更新部署

```bash
cd /opt/promptloom

# 拉取最新代码
git pull

# 重新构建前端
npm install
npm run build

# 如果 server/ 依赖有变化
cd server && npm install && cd ..

# 重启代理服务器
pm2 restart promptloom-server
# 或：systemctl restart promptloom

# Nginx 无需重启（静态文件直接生效）
```

---

## 五、验证部署

```bash
# 检查代理服务器是否正常运行
curl http://localhost:3001/api/messages \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'

# 检查 Nginx 是否正常代理
curl https://your-domain.com/api/messages \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'

# 查看服务器日志
pm2 logs promptloom-server
# 或：journalctl -u promptloom -f
```

---

## 六、算法工具扩展

工具列表维护在 `src/constants/tools.ts`，**每次修改后需重新构建前端**。

### 新增工具

```typescript
{
  id: 'tool_id',                    // 唯一标识，英文下划线
  name: '工具显示名称',
  description: '一句话描述',
  fullDescription: '详细说明，显示在工具详情弹窗',
  category: '所属分类',              // 必须是 TOOL_CATEGORIES 中已有的分类
  usageTemplate: '# 注入到提示词顶部的命令行',  // 无需注入则填 ''
  excludeCapabilities: ['能力1'],    // 告知 Claude 这些能力已由工具接管
}
```

### 新增分类

在 `src/constants/tools.ts` 末尾的 `TOOL_CATEGORIES` 数组中追加分类名，然后重新构建。

---

## 七、环境变量汇总

| 变量名 | 文件 | 说明 | 是否必填 |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | `server/.env` | Claude 系列 API Key | 使用 Claude 时必填 |
| `QWEN_API_KEY` | `server/.env` | Qwen 系列 API Key | 使用 Qwen 时必填 |
| `PORT` | `server/.env` | 代理服务器端口，默认 3001 | 可选 |

---

## 八、常见问题

**Q: 提示词生成时内容一次性出现，没有流式效果**

检查 Nginx 配置中 `location /api/` 块是否包含 `proxy_buffering off`。

**Q: 代理服务器返回 500 "API key not configured"**

`server/.env` 文件不存在或对应的 API Key 变量为空。检查 `server/config.js` 中当前 `model` 对应的 `apiKeyEnv` 字段，确认 `.env` 中该变量已填写。

**Q: 代理服务器返回 502**

大模型 API 请求失败。检查 `server/config.js` 中的 `hostname` 和 `path` 是否正确，以及 API Key 是否有效。

**Q: 切换模型后前端仍显示旧模型名称**

模型名称显示来自前端，修改 `server/config.js` 后无需重新构建前端，但如果前端有硬编码的模型名称显示，需要同步修改并重新构建。
