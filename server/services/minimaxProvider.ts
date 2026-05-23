import { fetchWithTimeout, isConfigured } from "./http";
import { mockProvider } from "./mockProvider";
import { callOpenAiChat } from "./openAiCompatible";
import type { AiProvider, ChatRequest, ImageRequest, TtsRequest, VideoJob } from "./types";

export function createMiniMaxProvider(): Partial<AiProvider> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || "https://minnimax.chat/v1";
  const chatModel = process.env.MINIMAX_CHAT_MODEL || "MiniMax-M2.7-highspeed";

  return {
    async chat(request: ChatRequest) {
      if (!isConfigured(apiKey)) throw new Error("MiniMax API key missing");
      return callOpenAiChat({
        source: "minimax",
        apiKey: apiKey!,
        baseUrl,
        model: chatModel
      }, request);
    },

    async tts(request: TtsRequest) {
      if (!isConfigured(apiKey)) throw new Error("MiniMax API key missing");
      const endpoint = `${(process.env.MINIMAX_TTS_BASE_URL || "https://api.minimax.chat/v1").replace(
        /\/$/,
        ""
      )}/t2a_v2`;
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "speech-02-turbo",
          text: request.text,
          stream: false,
          voice_setting: {
            voice_id: request.voiceId || process.env.MINIMAX_TTS_VOICE_ID || "male-qn-qingse",
            speed: 1,
            vol: 1,
            pitch: 0
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
            channel: 1
          }
        })
      });

      if (!response.ok) throw new Error(`MiniMax TTS failed: ${response.status}`);
      const data = await response.json();
      const audioBase64 = data?.data?.audio || data?.audio || data?.base_resp?.audio;
      if (!audioBase64) throw new Error("MiniMax TTS returned no audio");
      return {
        audioBase64,
        mimeType: "audio/mpeg",
        text: request.text,
        meta: { source: "minimax", fallback: false }
      };
    },

    async image(request: ImageRequest) {
      if (!isConfigured(apiKey)) throw new Error("MiniMax API key missing");
      const endpoint = process.env.MINIMAX_IMAGE_ENDPOINT;
      if (!endpoint) throw new Error("MiniMax image endpoint missing");
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "image-01",
          prompt: `儿童友好、手账风、暖白纸张、红色边距线、柔和卡通知识图：${request.prompt}`,
          aspect_ratio: "4:3",
          response_format: "url"
        })
      }, 45000);
      if (!response.ok) throw new Error(`MiniMax image failed: ${response.status}`);
      const data = await response.json();
      const imageUrl = data?.data?.image_urls?.[0] || data?.image_url || data?.url;
      if (!imageUrl) return mockProvider.image(request);
      return {
        imageUrl,
        prompt: request.prompt,
        caption: `跳跳学长给你生成了“${request.prompt}”知识图。`,
        meta: { source: "minimax", fallback: false }
      };
    },

    async createVideoJob(request: { prompt: string }): Promise<VideoJob> {
      if (!isConfigured(apiKey)) throw new Error("MiniMax API key missing");
      const endpoint = process.env.MINIMAX_VIDEO_ENDPOINT;
      if (!endpoint) throw new Error("MiniMax video endpoint missing");
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "video-01",
          prompt: `儿童科普短视频，温暖、卡通、乡村亲子共学场景：${request.prompt}`
        })
      }, 45000);
      if (!response.ok) throw new Error(`MiniMax video failed: ${response.status}`);
      const data = await response.json();
      return {
        id: data?.task_id || data?.id || `minimax-${Date.now()}`,
        status: "queued",
        prompt: request.prompt,
        progress: 5,
        message: "视频任务已提交，正在排队生成。",
        createdAt: Date.now(),
        meta: { source: "minimax", fallback: false }
      };
    }
  };
}
