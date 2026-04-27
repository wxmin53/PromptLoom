# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 启动方式

需要同时启动两个进程：

```bash
# 1. 代理服务器（必须先启动）
cd server && node index.js        # 监听 3001 端口

# 2. 前端开发服务器
npm run dev                        # 监听 5173 端口

# 构建
npm run build
```

代理服务器需要 `server/.env` 文件，内含 `ANTHROPIC_API_KEY`（参考 `server/.env.example`）。

## 架构概览

纯前端 SPA + 极简 Node.js 代理。前端不持有 API Key，所有 Claude API 调用经由 `server/index.js` 转发至 `api.ikuncode.cc`（Anthropic 兼容代理）。Vite dev 模式下 `/api/*` 请求通过 `vite.config.ts` proxy 转发到 3001 端口。

### 状态管理

全局状态集中在 `src/hooks/useAppState.ts`，使用单一 `useReducer`。所有 UI 状态（loading、error、结果、草稿抽屉开关）都在这里。`App.tsx` 是唯一的业务逻辑层，负责串联 API 调用和 dispatch。

关键状态字段：
- `inputSnapshot`：记录上次生成时的输入，用于「重新生成」时判断是否需要重走澄清流程
- `originalTemplate`：固定存储用户粘贴的原始模板，供 Diff 左侧使用（不随微调更新）
- `isBusy = isResultLoading || isClarificationLoading || isTuningLoading`：任一 loading 时禁用所有操作按钮

### 三个 Claude API 调用

均在 `src/hooks/useClaudeAPI.ts`，system prompt 模板在 `src/constants/prompts.ts`：

1. **fetchClarificationQuestions**：生成追问，返回 JSON `{questions: [...]}`。模型有时会在 JSON 外包裹 markdown 代码块或前缀文字，解析前需用正则提取 `{...}` 对象
2. **fetchGeneratedPrompt**：生成最终提示词，纯文本输出
3. **fetchTunedPrompt**：微调，无状态单轮，每次携带当前 textarea 最新内容

### 草稿持久化

- `sessionStorage`（key: `prompt_tool_session_drafts`）：调用2成功后自动保存，最多 10 条
- `localStorage`（key: `prompt_tool_saved_drafts`）：用户手动点「保存草稿」，最多 50 条
- 逻辑在 `src/hooks/useDrafts.ts`

### 枚举数据扩展

算法工具和提示词模块均为硬编码数组，后期扩展只需修改：
- `src/constants/tools.ts`：`ALGORITHM_TOOLS`，每个工具有 `excludeKeywords` 字段，选中后对应关键词从生成提示词中剔除
- `src/constants/modules.ts`：`PROMPT_MODULES`，每个模块有 `content` 字段，选中后原样追加到提示词末尾
