import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
import { createAiService } from "./services/aiService";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const ai = createAiService();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    providerMode: process.env.AI_PROVIDER_MODE ?? "auto",
    hasMiniMax: Boolean(process.env.MINIMAX_API_KEY),
    hasArk: Boolean(process.env.ARK_API_KEY),
    hasArkImage: Boolean(process.env.ARK_API_KEY && process.env.ARK_IMAGE_MODEL),
    hasArkChat: Boolean(process.env.ARK_API_KEY && process.env.ARK_CHAT_MODEL),
    hasArkVision: Boolean(process.env.ARK_API_KEY && process.env.ARK_VISION_MODEL),
    hasAliyunTts: Boolean(process.env.DASHSCOPE_API_KEY || process.env.ALIYUN_API_KEY || process.env.ALIBABA_API_KEY),
    hasVolcTts: Boolean(process.env.VOLC_TTS_APP_ID || process.env.DOUBAO_TTS_APP_ID),
    preferredTts: process.env.TTS_PROVIDER || "auto"
  });
});

const chatSchema = z.object({
  mode: z.enum(["explore", "reading", "parent-card", "quiz"]).default("explore"),
  message: z.string().min(1).max(2000),
  childProfile: z
    .object({
      nickname: z.string().max(20).optional(),
      ageBand: z.string().max(20).optional()
    })
    .optional(),
  context: z.record(z.string(), z.unknown()).optional()
});

app.post("/api/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "请求内容不完整，请重新试试。", details: parsed.error.flatten() });
    return;
  }

  const result = await ai.chat(parsed.data);

  // If MiniMax thinks images would help, generate TWO: storybook + realistic
  if (result.needsImage && result.imagePrompt && parsed.data.mode === "explore") {
    const images: Array<{ url: string; caption: string; style: "storybook" | "realistic" }> = [];

    // Generate storybook (绘本风) first
    try {
      const storyResult = await ai.image({
        prompt: result.imagePrompt,
        style: "storybook"
      });
      if (storyResult.imageUrl) {
        images.push({
          url: storyResult.imageUrl,
          caption: `绘本插图：${result.imagePrompt}`,
          style: "storybook"
        });
      }
    } catch (error) {
      console.warn("[chat-image:storybook]", error instanceof Error ? error.message : error);
    }

    // Generate realistic photo
    try {
      const realResult = await ai.image({
        prompt: result.imagePrompt,
        style: "realistic"
      });
      if (realResult.imageUrl) {
        images.push({
          url: realResult.imageUrl,
          caption: `真实照片：${result.imagePrompt}`,
          style: "realistic"
        });
      }
    } catch (error) {
      console.warn("[chat-image:realistic]", error instanceof Error ? error.message : error);
    }

    if (images.length > 0) {
      result.images = images;
    }
  }

  res.json(result);
});

const ttsSchema = z.object({
  text: z.string().min(1).max(1200),
  voiceId: z.string().max(80).optional()
});

app.post("/api/tts", async (req, res) => {
  const parsed = ttsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "朗读内容太长或为空。", details: parsed.error.flatten() });
    return;
  }

  const result = await ai.tts(parsed.data);
  res.json(result);
});

const visionSchema = z.object({
  imageDataUrl: z.string().min(20).max(8_000_000),
  taskType: z.enum(["handwriting", "homework", "object"]).default("handwriting")
});

app.post("/api/vision", async (req, res) => {
  const parsed = visionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "图片内容无法读取，请换一张清晰照片。", details: parsed.error.flatten() });
    return;
  }

  const result = await ai.vision(parsed.data);
  res.json(result);
});

const imageSchema = z.object({
  prompt: z.string().min(1).max(800),
  style: z.enum(["knowledge-card", "sticker", "storybook", "realistic"]).default("knowledge-card")
});

app.post("/api/image", async (req, res) => {
  const parsed = imageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "请写一个想看的知识图主题。", details: parsed.error.flatten() });
    return;
  }

  const result = await ai.image(parsed.data);
  res.json(result);
});

const videoSchema = z.object({
  prompt: z.string().min(1).max(800)
});

app.post("/api/video/jobs", async (req, res) => {
  const parsed = videoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "请写一个想生成的小视频主题。", details: parsed.error.flatten() });
    return;
  }

  const result = await ai.createVideoJob(parsed.data);
  res.json(result);
});

app.get("/api/video/jobs/:id", async (req, res) => {
  const result = await ai.getVideoJob(req.params.id);
  res.json(result);
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error("[api-error]", err);
  res.status(500).json({
    error: "跳跳学长刚才有点卡壳了，我们换个方式继续。",
    source: "server"
  });
});

app.listen(port, () => {
  console.log(`Tiaotiao API listening on http://localhost:${port}`);
});
