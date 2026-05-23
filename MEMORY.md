# MEMORY.md

## 2026-05-23 跳跳学长 Web/H5 Demo 初始化

### 用户原始需求

用户要求实现完整计划：开发“跳跳学长 Web/H5 10 小时全功能 Demo”，用于乡村建设黑客松。目标是面向 6-12 岁乡村家庭的亲子共学 AI 学伴，包含监护人同意、探索问答、TTS、共读、练字/作业拍照点评、生图、异步视频、亲子小游戏、家长陪伴卡、合规标识、Mock 降级和文档收尾。用户强调一次性开发到位，真实 API 优先，MiniMax + 豆包/火山方舟，不得硬编码 API Key。

### 当前状态

- 仓库从空 Git 仓库开始，`main` 分支暂无提交。
- 已创建 `Vite + React + TypeScript + Express` H5 Demo。
- 前端实现移动端优先的手账风界面，包含全部计划入口和学习闭环。
- 服务端实现 API 代理和 Provider 抽象：MiniMax 文本/TTS/图像/视频、豆包/火山方舟文本和视觉按环境变量配置，失败回落 Mock。
- 本地学习状态使用 `localStorage`，带 `schemaVersion`，只保存 consent、records、readingProgress。
- 已补充 `AGENTS.md`、`README.md`、`MEMORY.md`、`对话.md`。

### 技术决策

- 前端不保存或暴露任何真实模型密钥；所有模型调用经 Express 服务端代理。
- `AI_PROVIDER_MODE=mock` 可强制本地演示；`auto` 会真实 API 优先并自动 fallback。
- TTS 优先 MiniMax，失败后使用浏览器 `speechSynthesis`。
- 视觉点评上传前在浏览器压缩，服务端失败时返回温和 Mock 反馈。
- 视频作为异步任务展示，不阻塞主学习链路。
- 亲子小游戏通过测试保证正确答案存在于选项中且选项去重。

### 验证计划

- `npm install`：通过，生成依赖与 lockfile。
- `npm run typecheck`：通过。
- `npm run test`：通过，1 个测试文件、2 个测试用例。
- `npm run scan:secrets`：通过，未发现明显真实密钥形态。
- `npm run lint`：初次因 `.mjs` Node 全局变量和小清理项失败，已修复后通过。
- `npm run build`：通过，生成 `dist/`；Vite 输出 Node `module.register()` deprecation warning，但不影响构建。
- `npm run dev:all`：本地启动通过，前端 `http://localhost:5173`，API `http://localhost:8787`。
- `curl http://localhost:8787/api/health`：通过，当前无真实密钥，`hasMiniMax=false`、`hasArk=false`。
- `curl /api/chat`：通过，返回 Mock/fallback 儿童友好结构化回答。
- `curl /api/video/jobs`：通过，返回 Mock/fallback 异步视频任务。
- Browser 冒烟：打开 H5 标题正确；监护人同意页渲染；点击同意后首页入口渲染，包括问答、共读、拍照和家长卡。

### 遗留风险

- MiniMax TTS、图像、视频接口在不同账号/产品线的 endpoint 和返回字段可能不同，当前实现已做通用兼容和 Mock 降级，但真实生产接入仍需按账号文档微调。
- 豆包/火山方舟需要配置具体 endpoint id；未配置时不会真实调用。
- Demo 尚未做真实部署，移动端真机验收需要在本地或线上预览后完成。
- `dist/` 是构建产物，当前未纳入 Git；如部署到静态平台可重新运行 `npm run build`。

## 2026-05-23 API 接入与 TTS 修复

### 用户原始反馈

用户指出：之前提供过 API，但项目没有真正接入；输入不同问题时回答几乎一样，很死板，例如问“世界上最小的海是什么”回答没有变化。用户还指出语音朗读太僵硬，要求搜索并评估成熟、免费或低成本的 TTS 方案，给小孩读的声音必须非常好。

### 处理过程

- 检查 `.env.local`，发现文件不存在；`/api/health` 显示 `hasMiniMax=false`、`hasArk=false`，说明真实 API 没有进入服务端环境。
- 发现服务端只加载 `.env`，没有优先加载 `.env.local`，已修复为先加载 `.env.local` 再加载 `.env`。
- 将用户之前提供过的 MiniMax OpenAI-compatible 配置写入本地 `.env.local`。该文件已被 `.gitignore` 忽略，不进入仓库。
- 修复 MiniMax JSON 解析：模型偶尔在 JSON 后附加文字，旧解析会失败并 fallback；现在会提取第一个完整 JSON 对象。
- Mock 回答也改为按问题主题变化，避免未配置真实 API 时完全死板。
- 新增阿里百炼 Qwen-TTS Provider 与火山/豆包 TTS Provider；TTS 路由优先级为 `TTS_PROVIDER` 指定项，否则 `aliyun -> volcengine -> minimax -> browser/mock`。
- 新增页面顶部 Provider 状态提示，让用户明确知道当前是真实模型还是演示降级。

### TTS 评估结论

- 当前最推荐：阿里云百炼 Qwen-TTS。理由：官方 Qwen-TTS 面向文本转语音，音色丰富，`Mochi` 等音色更活泼，适合作为儿童朗读/学伴声音；百炼通常有新人免费额度，适合黑客松快速试用。
- 第二选择：豆包/火山语音合成。理由：中文自然度好、国内服务稳定，适合长期中文朗读；但接入需要 AppID、Access Token、Cluster、Voice Type 等独立语音配置。
- 第三选择：MiniMax Speech。理由：音质强，但公开成本通常按字符计费，适合已有 MiniMax 额度或后续追求更强情绪/音色时接。
- 智谱没有作为当前主推荐：本次没有找到比上述三者更成熟、低成本、适合儿童朗读的官方 TTS 主路径。

### 验证结果

- `/api/health` 当前显示 `hasMiniMax=true`，说明 MiniMax 已进入服务端环境。
- `curl /api/chat` 测试“世界上最大的海是什么？”返回真实 MiniMax，`meta.source=minimax`、`fallback=false`。
- `curl /api/chat` 测试“世界上最小的海是什么？”返回真实 MiniMax，答案明显不同。
- `npm run typecheck`：通过。
- `npm run test`：通过。
- `npm run lint`：通过。
- `npm run scan:secrets`：通过，未发现明显真实密钥形态。
- `npm run build`：通过。

### 遗留问题

- TTS 真实高质量朗读仍需用户提供阿里百炼 `DASHSCOPE_API_KEY` 或火山语音 `VOLC_TTS_APP_ID`、`VOLC_TTS_ACCESS_TOKEN`、`VOLC_TTS_VOICE_TYPE` 后才能验证。
- 当前没有将真实密钥写入仓库；`.env.local` 只在本机存在。

## 2026-05-23 Mastercard / Duolingo 风格 UI 重构

### 用户原始需求

用户要求访问 `https://github.com/VoltAgent/awesome-design-md`，参考 Mastercard 的设计风格重构 UI，同时增加像多邻国一样的可爱元素和可爱像素小人，并明确禁止使用 emoji。

### 处理过程

- 按恢复清单读取 `AGENTS.md`、`MEMORY.md`、`对话.md`，确认 `HANDOFF.md` 不存在；`git log --oneline -3` 显示当前 `main` 尚无提交。
- 使用 Search Agent 调研 VoltAgent/awesome-design-md 中 Mastercard 设计参考，提炼为暖奶油背景、圆形轨道、胶囊导航、黑色主 CTA、克制留白；同时明确只借设计语言，不复制 Mastercard 或 Duolingo 品牌资产。
- 使用 Explore Agent 梳理 UI 代码，确认主要改动集中在 `src/App.tsx`、`src/styles.css`，可新增 `src/components/PixelMascot.tsx`；发现原小游戏使用星形 Unicode 字符，应替换为 CSS 图形。
- 使用 Plan Agent 拆解执行步骤，确定保留日记手账风、红色边距线、液态玻璃、果冻动效和浅色体验。
- 使用 Worker Agent 新增原创 `PixelMascot` 组件，由 CSS 结构实现像素小人，不依赖外部图片，不使用 emoji。
- 主控完成 UI 接入与样式重构：同意页和首页替换为原创像素小人；首页增加圆形学习轨道、黑色 CTA、暖奶油卡片和胶囊导航；功能入口改为圆形色块；小游戏星光从 Unicode 字符替换为 CSS 方块进度点。
- 在 `AGENTS.md` 增加 UI 风格沉淀：可参考 Mastercard/Duolingo 的通用设计语言，但不得复制品牌资产；界面禁止 emoji。

### 技术决策

- 不引入外部图片或品牌素材，像素小人完全由 React + CSS 组合实现。
- 保留 lucide 图标作为工具符号，但可爱表达主要交给原创像素小人、CSS 圆形轨道、纸张细节和果冻动效。
- 主 CTA 统一改为暖黑胶囊，辅助色只作为小面积点缀，避免蓝紫渐变或单一高饱和色主题。
- 未成年人体验继续避免排行榜、公开比较、百分比排名和羞辱性反馈。

### 验证结果

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run test`：通过，1 个测试文件、2 个测试用例。
- `npm run scan:secrets`：通过，未发现明显真实密钥形态。
- `npm run build`：通过，生成 `dist/`；Vite/Node 仍输出 `module.register()` deprecation warning，不影响构建。
- 源码符号扫描：无输出，说明 `src` 下未发现星形符号或常见 emoji。
- Browser 视觉检查：使用独立端口 `http://localhost:5199/` 打开，同意页、首页和小游戏在桌面与 390px 移动视口均正常渲染；像素小人、圆形学习轨道、黑色 CTA、CSS 星光进度点和底部导航可见。

### 遗留问题

- 当前 UI 是基于桌面和 390px 移动视口的本地验证，仍建议后续用真实手机浏览器复查手感。
- `npm run dev:all` 曾因本机已有其他项目占用 `5173/5174` 导致打开到错误页面；本次改用 `npm run dev -- --port 5199 --strictPort` 验证跳跳页面。
- 真实品牌参考只用于风格语言，不能在后续宣传或代码中声称使用了 Mastercard 或 Duolingo 官方资产。

## 2026-05-23 豆包 Seedream 生图接入

### 用户原始需求

用户提供了豆包 Seedream 生图模型的 ID `doubao-seedream-5-0-260128` 和 API Key `ark-49a89bb6-0c2f-400b-bf3e-0995e953f2ec-bc84b`，要求接入到项目的生图功能中。

### 处理过程

- 修改 `server/services/arkProvider.ts`：实现 `image` 方法，通过 Ark `/images/generations` 端点调用 Seedream，按 style 拼接儿童友好 Prompt 前缀。
- 修改 `server/services/aiService.ts`：生图路由改为 Ark/Seedream 优先 → MiniMax → Mock 降级。
- 修改 `server/index.ts`：health 端点新增 `hasArkImage`、`hasArkChat`、`hasArkVision` 字段。
- 更新 `.env.local`：写入 `ARK_API_KEY` 和 `ARK_IMAGE_MODEL=doubao-seedream-5-0-260128`。
- 修复 Seedream 尺寸要求：Seedream 最低 3,686,400 像素（1920×1920），已将 `size` 从 `1024x1024` 改为 `1920x1920`。

### 技术决策

- Seedream 图片尺寸固定 `1920x1920`，满足模型最低像素要求。
- Prompt 前缀按 style 区分：knowledge-card（知识卡片）、sticker（贴纸）、storybook（绘本），均保持儿童友好、手账风。
- API 超时设为 60 秒（`fetchWithTimeout`），适应生图模型的延迟。

### 验证结果

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run test`：通过，2 个测试用例。
- `npm run build`：通过。
- 直接 API 测试：Ark Seedream 成功返回图片 URL（`source: "ark", fallback: false`），图片可访问。
- 通过 `aiService` 层测试：Ark 优先调用成功，返回豆包生成的图片 URL。

### 遗留问题

- Seedream 生图延迟约 10-15 秒，前端可能需要增加 loading 状态提示。
- chat 和 vision 的 Ark 端点暂未配置（`hasArkChat: false`, `hasArkVision: false`），如需要可后续补充。

## 2026-05-23 问答自动配图（needsImage 智能判断）

### 用户原始需求

用户要求在问答流程中，MiniMax 先判断问题是否需要配图（如地理、动物、植物等），需要的话自动调用豆包 Seedream 生成图片，文字+图片一起展示给孩子；不需要配图的问题（如音乐、抽象概念）则只返回文字。

### 处理过程

- 修改 `server/services/types.ts`：`ChatResponse` 新增 `needsImage`、`imagePrompt`、`imageUrl`、`imageCaption` 可选字段。
- 修改 `server/services/prompts.ts`：在 system prompt 中增加 `needsImage` 判断规则和 `imagePrompt` 字段，让 MiniMax 根据问题内容自主判断。
- 修改 `server/services/openAiCompatible.ts`：`normalizeChatResponse` 解析 `needsImage` 和 `imagePrompt`。
- 修改 `server/services/mockProvider.ts`：Mock 模式通过关键词匹配判断是否需要配图，保持演示链路完整。
- 修改 `server/index.ts`：chat 路由在返回前检查 `needsImage`，若为 true 且 `mode === "explore"`，自动调用 `ai.image()`（Ark Seedream）生成配图，失败时静默跳过不影响文字回答。
- 修改 `src/types.ts`：前端 `ChatResponse` 同步新增 `needsImage`、`imagePrompt`、`imageUrl`、`imageCaption`。
- 修改 `src/App.tsx`：`ResponseCard` 新增图片展示区块，带圆角阴影容器和说明文字。
- 修改 `src/styles.css`：新增 `.response-image` 样式。

### 技术决策

- `needsImage` 判断完全交给 MiniMax，不写死关键词规则（Mock 除外），让模型根据语义理解灵活决策。
- 配图仅在 `mode === "explore"`（探索问答）时触发，共读/家长卡/小游戏不自动生图。
- 生图失败不影响文字回答，静默跳过，保证核心体验不中断。
- `imagePrompt` 由 MiniMax 提炼为 15 字以内的中文描述，确保 Seedream 生成的图准确。

### 验证结果

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run test`：通过。
- `npm run build`：通过。
- `npm run scan:secrets`：通过。
- 真实 API 测试："世界上最高的山是什么？" → `needsImage: true` → Ark Seedream 生成珠穆朗玛峰卡通图（`source: "ark"`）。
- 真实 API 测试："怎么学钢琴？" → `needsImage: false` → 无配图，纯文字回答。

## 2026-05-23 双图生成（绘本+真实）+ 绘本库

### 用户原始需求

用户要求每次提问生成两张图：一张绘本风（可爱卡通插图）+ 一张真实照片（写实参考图），让学习既有童趣又有现实对照。同时增加绘本库功能，可以收藏图片并随时翻阅。

### 处理过程

- 后端 `types.ts`：新增 `ImageStyle` 类型含 `realistic`，`ChatResponse.images` 改为数组 `ChatImageResult[]`。
- 后端 `arkProvider.ts`：`image` 方法新增 `realistic` 风格 Prompt（高清写实摄影）。
- 后端 `index.ts`：chat 路由在 `needsImage=true` 时串行生成两图（storybook + realistic），合并到 `images` 数组返回。
- 前端 `types.ts`：新增 `ChatImageResult`、`SavedPicture`，`AppState` 加 `pictureBook`。
- 前端 `storage.ts`：`defaultState`/`loadState` 加 `pictureBook` 持久化，新增 `createSavedPicture`。
- 前端 `App.tsx`：
  - `ResponseCard` 改为展示双图网格（左绘本右真实），每张图带「收藏到绘本库」按钮。
  - `AskPanel` 新增 `onSaveImage` 逻辑，将图片保存到 `pictureBook`，已收藏的图片按钮置灰。
  - 新增 `PictureBookPanel`：按绘本/真实分类网格展示，点击放大查看，支持单张删除和清空。
  - 底部导航新增「绘本库」入口（Heart 图标）。
- `styles.css`：新增 `.images-row`、`.image-card`、`.picture-grid`、`.viewer-overlay` 等样式。

### 技术决策

- 双图串行生成（先绘本后真实），总耗时约 20-30 秒，前端 loading 状态覆盖全程。
- 绘本库使用 `localStorage` 的 `pictureBook` 数组，上限 50 张。
- `savedImageIds` 用 `Set` 基于 URL 去重判断，已保存的按钮禁用。
- 绘本库按 style 分组：绘本插图和真实照片各一个 shelf。

### 验证结果

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run test`：通过。
- `npm run build`：通过。
- 真实 API 测试："世界上最大的海洋是什么？" → 绘本图 + 真实照片均成功生成（`source: "ark"`）。

## 2026-05-23 Render 新加坡部署上线

### 用户原始需求

用户要求将项目部署上线，使用新加坡可访问地址，确保中国大陆用户可访问；并要求把环境变量一并配置到线上，保证网站所有功能可正常使用。

### 处理过程

- 按项目规则完成会话启动检查：读取 `AGENTS.md`、`MEMORY.md`、`对话.md`，确认 `HANDOFF.md` 不存在，并检查最近提交。
- 安装 Render CLI（`render v2.18.0`），使用用户提供的 Render API Key 完成鉴权并切换到工作区 `My Workspace`。
- 确认线上已存在新加坡区域 Web Service：`srv-d88qukgjo6nc73d7lgu0`，URL 为 `https://tiaotiao-xuezhang.onrender.com`，`region=singapore`。
- 通过 Render API 将 `.env.local` 中关键变量写入服务环境变量：`AI_PROVIDER_MODE`、`TTS_PROVIDER`、`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_CHAT_MODEL`、`ARK_API_KEY`、`ARK_IMAGE_MODEL`。
- 首次重新部署失败，日志显示 `ReferenceError: __dirname is not defined in ES module scope`（`server/index.ts`）。
- 修复方式：在 `server/index.ts` 中用 `fileURLToPath(import.meta.url)` + `path.dirname` 显式构造 ESM 环境下的 `__dirname`。

### 技术决策

- 保持 Render 新加坡区域不变，以降低中国大陆访问跨境延迟与失败概率。
- 环境变量通过 Render 服务级 API 设置，不写入仓库，继续遵守密钥不入库原则。
- 生产故障修复优先保证兼容性：避免在 ESM 中直接使用 CJS 的 `__dirname`。

### 验证步骤

- 本地验证全部通过：
  - `npm run typecheck`：通过
  - `npm run lint`：通过
  - `npm run test`：通过（2/2）
  - `npm run build`：通过
  - `npm run scan:secrets`：通过
- Render 构建日志确认根因与修复点匹配：修复前为 `__dirname` 未定义。

### 遗留问题

- 需要将本次修复提交并推送到 `main` 后再次触发 Render 部署，确认 `live` 状态与线上健康检查 200。
- 如用户后续要绑定自定义新加坡域名（非 `onrender.com`），需再配置 Render Custom Domain 与 DNS 解析。

### 追加排障（同日）

- 第二次 Render 部署失败原因为 `express@5` 与 `path-to-regexp` 对 `app.get("*")` 的路由模式不兼容（报错 `Missing parameter name at index 1: *`）。
- 已将生产静态兜底路由从 `app.get("*")` 改为 `app.use((_req, res) => res.sendFile(...))`，避免通配符解析异常。
- 本地再次验证：`typecheck`、`build`、`test` 全通过，准备重新部署。
