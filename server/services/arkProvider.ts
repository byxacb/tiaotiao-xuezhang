import { fetchWithTimeout, isConfigured } from "./http";
import { mockProvider } from "./mockProvider";
import { callArkVision, callOpenAiChat } from "./openAiCompatible";
import type { AiProvider, ChatRequest, ImageRequest, VideoJob, VisionRequest } from "./types";

export function createArkProvider(): Partial<AiProvider> {
  const apiKey = process.env.ARK_API_KEY;
  const baseUrl = process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  const chatModel = process.env.ARK_CHAT_MODEL;
  const visionModel = process.env.ARK_VISION_MODEL;
  const imageModel = process.env.ARK_IMAGE_MODEL;

  return {
    async chat(request: ChatRequest) {
      if (!isConfigured(apiKey) || !isConfigured(chatModel)) throw new Error("Ark chat not configured");
      return callOpenAiChat({
        source: "ark",
        apiKey: apiKey!,
        baseUrl,
        model: chatModel!
      }, request);
    },

    async vision(request: VisionRequest) {
      if (!isConfigured(apiKey) || !isConfigured(visionModel)) throw new Error("Ark vision not configured");
      return callArkVision({
        source: "ark",
        apiKey: apiKey!,
        baseUrl,
        model: visionModel!
      }, request);
    },

    async image(request: ImageRequest) {
      if (!isConfigured(apiKey) || !isConfigured(imageModel)) throw new Error("Ark image not configured");

      const stylePrefix =
        request.style === "realistic"
          ? "高清写实摄影风格，真实照片质感，自然光线，清晰细节："
          : request.style === "knowledge-card"
          ? "儿童友好知识卡片，手账风、暖白纸张、柔和卡通插图，中文标注，适合6-12岁儿童："
          : request.style === "sticker"
          ? "可爱贴纸风格，圆润卡通角色，透明背景可选，儿童友好："
          : "儿童绘本插画风格，温暖色调，乡村亲子共学场景，可爱像素小人：";

      const response = await fetchWithTimeout(
        `${baseUrl.replace(/\/$/, "")}/images/generations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: imageModel,
            prompt: `${stylePrefix}${request.prompt}`,
            size: "1920x1920",
            response_format: "url"
          })
        },
        60000
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Ark image failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const imageUrl = data?.data?.[0]?.url || data?.url;
      if (!imageUrl) return mockProvider.image(request);

      const styleLabel =
        request.style === "realistic" ? "真实照片" : "绘本插图";

      return {
        imageUrl,
        prompt: request.prompt,
        caption: `跳跳学长用豆包给你生成了"${request.prompt}"${styleLabel}。`,
        meta: { source: "ark", fallback: false }
      };
    },

    async createVideoJob(request: { prompt: string }): Promise<VideoJob> {
      throw new Error(`Ark video provider not configured for ${request.prompt}`);
    }
  };
}
