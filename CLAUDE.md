# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 启动方式

需要同时启动两个进程：

```bash
# 1. 代理服务器（必须先启动，从任意目录均可）
node server/index.js        # 监听 3001 端口

# 2. 前端开发服务器
npm run dev                  # 监听 5173 端口

# 构建生产包
npm run build
```

代理服务器需要 `server/.env` 文件，内含 API Key（参考 `server/.env.example`）。`dotenv` 路径基于 `__dirname`，从任意目录启动均可正确读取。

## 架构概览

纯前端 SPA + 极简 Node.js 代理。前端不持有 API Key，所有大模型 API 调用经由 `server/index.js` 转发。Vite dev 模式下 `/api/*` 请求通过 `vite.config.ts` proxy 转发到 3001 端口。

## 模型配置

模型切换和 API 配置集中在两个文件：

- **`server/config.js`**：切换模型只需改 `model` 字段，支持 Claude 系列（Anthropic 格式）和 Qwen 系列（OpenAI 兼容格式）
- **`server/.env`**：存放 API Key，`ANTHROPIC_API_KEY` 用于 Claude，`QWEN_API_KEY` 用于 Qwen

如接入公司自建大模型，在 `server/config.js` 的 `providers` 里新增条目，修改 `hostname` 和 `path`。

## 代理服务器端点

`server/index.js` 提供两个端点：

- **POST /api/messages**：普通 JSON 请求，用于追问、工具推荐、微调。90s 超时。
- **POST /api/messages/stream**：流式 SSE 请求，用于提示词生成和微调。自动注入 `stream: true`，直接 pipe 原始 SSE 字节流，不设超时（流式连接持续传输，不会触发 Cloudflare 524）。

## 状态管理

全局状态集中在 `src/hooks/useAppState.ts`，使用单一 `useReducer`。`App.tsx` 是唯一的业务逻辑层，负责串联 API 调用和 dispatch。

关键状态字段：
- `inputSnapshot`：记录上次生成时的输入（需求、模板、工具、模块），用于「重新生成」时判断是否需要重走追问流程
- `originalTemplate`：固定存储用户粘贴的原始模板，供 Diff 左侧使用（不随微调更新）
- `previousResult`：上一次生成结果，供 Diff 右侧对比
- `pendingTuningResult`：微调 AI 回复的暂存结果，用户点「确认应用」后才写入 `result`
- `recommendedToolIds`：智能推荐返回的工具 id 列表
- `isBusy = isResultLoading || isClarificationLoading || isTuningLoading`：任一 loading 时禁用所有操作按钮

## Claude API 调用

均在 `src/hooks/useClaudeAPI.ts`，system prompt 模板在 `src/constants/prompts.ts`：

| 函数 | 端点 | max_tokens | 用途 |
|---|---|---|---|
| `fetchClarificationQuestions` | `/api/messages` | 512 | 生成追问，返回 JSON `{questions: [...]}` |
| `streamGeneratedPrompt` | `/api/messages/stream` | 16384 | 流式生成提示词，callback 逐 chunk 回调 |
| `fetchTunedPrompt` | `/api/messages/stream` | 16384 | 流式微调，携带最近 6 条 `history: TuningMessage[]` |
| `fetchToolRecommendations` | `/api/messages` | 256 | 智能推荐工具，返回 id 数组 |

### 流式生成注意事项

- `START_GENERATION` 会先把 `result` 清空，再通过 `APPEND_RESULT_CHUNK` 逐块追加
- toolBlock（选中工具的 `usageTemplate`）在流开始前作为第一个 chunk dispatch，出现在结果最顶部
- 流结束后 dispatch `GENERATION_SUCCESS` with empty payload（仅触发 loading 结束，不覆盖 result）
- 草稿自动保存通过 `useEffect` 监听 `isResultLoading` 从 true → false 触发
- 微调同样走流式，通过 `APPEND_TUNING_CHUNK` 逐块累积到 `pendingTuningResult`

### 追问与模板预处理

`src/constants/prompts.ts` 中的 `stripToolCommands()` 会在把 `templateInput` 传给 Claude 之前，剥离模板顶部连续的 `# ` 开头行（算法工具命令），避免与新选工具的 `usageTemplate` 重复。

## 算法工具

`src/constants/tools.ts` 导出 `ALGORITHM_TOOLS`（51 个工具）和 `TOOL_CATEGORIES`（9 个分类）。

每个工具的关键字段：
- `usageTemplate`：选中后注入到生成结果**最顶部**的命令行（前端 post-processing，不经过 Claude）
- `excludeCapabilities`：选中后告知 Claude 这些能力已由工具接管，提示词正文中不要重复描述

扩展工具只需在 `ALGORITHM_TOOLS` 数组中添加条目，无需改其他文件。

9 个分类：基础控制、知识库与检索、时间处理、地址与意图、承接词、话术控制、数据处理、增强能力、流程控制。

## 提示词模块

模块数据存储在 `localStorage`（key: `prompt_tool_modules`），通过 `src/hooks/useModules.ts` 管理 CRUD。

选中模块后，Claude 会根据模块语义将其内容插入到生成提示词的相应位置（非固定追加末尾）。模块内容传给 Claude 时带有 `【模块：名称】` 标签，system prompt 要求逐字保留、不得遗漏。

## 草稿持久化

- `sessionStorage`（key: `prompt_tool_session_drafts`）：生成成功后自动保存，最多 10 条
- `localStorage`（key: `prompt_tool_saved_drafts`）：用户手动点「保存草稿」，最多 50 条
- 逻辑在 `src/hooks/useDrafts.ts`

## 重新生成逻辑

`handleRegenerate` 调用 `inputsChangedSinceLastGeneration()` 比较当前输入与 `inputSnapshot`（需求、模板、工具、模块四项）：
- 有变化 → 重走追问流程（`startClarification`）
- 无变化 → 沿用上次追问答案直接生成（`generatePrompt`）
