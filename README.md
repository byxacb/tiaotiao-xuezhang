# 跳跳学长 Web/H5 Demo

面向 6-12 岁乡村家庭的亲子共学 AI 学伴。它不是替代老师或家长，而是让孩子和家人在晚饭后 10-15 分钟里完成一次“提问、听讲、共读、拍照点评、小游戏、家长陪伴卡”的学习闭环。

## 功能

- 监护人同意页：未同意前不能进入核心功能，支持清除本地数据。
- 探索问答：儿童友好回答，固定“先鼓励、再追问、再解释、再小任务、给家长一句话”。
- 共读模式：内置自建短文，支持逐段朗读、解释和提问。
- 拍照点评：上传前浏览器压缩，温和点评练字/作业，不评分、不排名。
- 生成知识图：服务端代理调用真实图像 API，失败降级为本地占位图。
- 异步视频：提交任务、轮询进度、完成展示；真实 API 不可用时走演示任务。
- 亲子小游戏：正确答案必须在选项中，选项去重，不做排行榜。
- 家长陪伴卡：基于同一份学习记录生成陪伴话术。

## 启动

```bash
npm install
cp .env.example .env.local
npm run dev:all
```

前端默认运行在 `http://localhost:5173`，服务端 API 默认运行在 `http://localhost:8787`。

## 环境变量

真实密钥只允许写入 `.env.local` 或部署平台 Secret，不能提交到 Git。缺少密钥时系统会自动使用 Mock Provider，保证黑客松演示不中断。

```bash
AI_PROVIDER_MODE=auto
MINIMAX_API_KEY=...
MINIMAX_BASE_URL=https://minnimax.chat/v1
MINIMAX_CHAT_MODEL=MiniMax-M2.7-highspeed
ARK_API_KEY=...
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_CHAT_MODEL=...
ARK_VISION_MODEL=...
TTS_PROVIDER=auto
DASHSCOPE_API_KEY=...
ALIYUN_TTS_MODEL=qwen3-tts-flash
ALIYUN_TTS_VOICE=Mochi
VOLC_TTS_APP_ID=...
VOLC_TTS_ACCESS_TOKEN=...
VOLC_TTS_VOICE_TYPE=...
```

如果要强制本地演示模式：

```bash
AI_PROVIDER_MODE=mock
```

## TTS 选型建议

当前推荐优先接入阿里云百炼 Qwen-TTS：官方文档支持 `qwen3-tts-flash`、系统音色丰富，`Mochi` 偏聪明活泼、适合作为“跳跳学长”的儿童友好声音。阿里云百炼新用户有新人免费额度，适合黑客松试用。

第二选择是豆包/火山语音：音色自然，官方音频技术产品有免费调用和低价包，适合后续做长期中文朗读，但接入需要 AppID、Access Token、Cluster 和具体音色 ID。

MiniMax Speech 音质也强，但公开价格按美元字符计费，更适合已有 MiniMax 额度或需要声音复刻时使用。

## 验证

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run scan:secrets
```

## 合规边界

- 不采集真实姓名、学校、手机号、定位等身份信息。
- 图片仅用于本次点评，前端不持久化原图。
- 所有 AI 文本、配音、图片、视频均显示 AI 生成或降级标识。
- 遇到危险、隐私、自伤、欺凌等输入时，Prompt 要引导孩子找家长、老师或可信成年人。
- 共读内容只允许自建、公版、授权或用户上传材料；不要抓取或复述仍在版权期内的整本书。
