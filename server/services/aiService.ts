import { createArkProvider } from "./arkProvider";
import { createAliyunTtsProvider } from "./aliyunTtsProvider";
import { createMiniMaxProvider } from "./minimaxProvider";
import { mockProvider } from "./mockProvider";
import { createVolcTtsProvider } from "./volcTtsProvider";
import type {
  AiProvider,
  ChatRequest,
  ImageRequest,
  TtsRequest,
  VideoJob,
  VisionRequest
} from "./types";

function withFallback<T>(sourceName: string, call: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (process.env.AI_PROVIDER_MODE === "mock") {
    return fallback();
  }
  return call().catch(async (error) => {
    console.warn(`[provider-fallback:${sourceName}]`, error instanceof Error ? error.message : error);
    return fallback();
  });
}

export function createAiService(): AiProvider {
  const minimax = createMiniMaxProvider();
  const ark = createArkProvider();
  const aliyunTts = createAliyunTtsProvider();
  const volcTts = createVolcTtsProvider();

  return {
    chat(request: ChatRequest) {
      return withFallback(
        "chat",
        async () => {
          try {
            if (ark.chat) return await ark.chat(request);
          } catch (error) {
            console.warn("[provider-fallback:ark-chat]", error instanceof Error ? error.message : error);
          }
          if (minimax.chat) return minimax.chat(request);
          throw new Error("No chat provider configured");
        },
        () => mockProvider.chat(request)
      );
    },

    tts(request: TtsRequest) {
      return withFallback(
        "tts",
        async () => {
          const preferred = process.env.TTS_PROVIDER || "auto";
          if (preferred === "aliyun" && aliyunTts.tts) return aliyunTts.tts(request);
          if ((preferred === "doubao" || preferred === "volcengine") && volcTts.tts) return volcTts.tts(request);
          if (preferred === "minimax" && minimax.tts) return minimax.tts(request);

          try {
            if (aliyunTts.tts) return await aliyunTts.tts(request);
          } catch (error) {
            console.warn("[provider-fallback:aliyun-tts]", error instanceof Error ? error.message : error);
          }
          try {
            if (volcTts.tts) return await volcTts.tts(request);
          } catch (error) {
            console.warn("[provider-fallback:volc-tts]", error instanceof Error ? error.message : error);
          }
          if (minimax.tts) return minimax.tts(request);
          throw new Error("No TTS provider configured");
        },
        () => mockProvider.tts(request)
      );
    },

    vision(request: VisionRequest) {
      return withFallback(
        "vision",
        async () => {
          if (ark.vision) return ark.vision(request);
          throw new Error("No vision provider configured");
        },
        () => mockProvider.vision(request)
      );
    },

    image(request: ImageRequest) {
      return withFallback(
        "image",
        async () => {
          // Ark/Seedream first (better image quality), then MiniMax, then mock
          try {
            if (ark.image) return await ark.image(request);
          } catch (error) {
            console.warn("[provider-fallback:ark-image]", error instanceof Error ? error.message : error);
          }
          if (minimax.image) return minimax.image(request);
          throw new Error("No image provider configured");
        },
        () => mockProvider.image(request)
      );
    },

    createVideoJob(request: { prompt: string }) {
      return withFallback<VideoJob>(
        "video",
        async () => {
          if (minimax.createVideoJob) return minimax.createVideoJob(request);
          throw new Error("No video provider configured");
        },
        () => mockProvider.createVideoJob(request)
      );
    },

    getVideoJob(id: string) {
      return mockProvider.getVideoJob(id);
    }
  };
}
