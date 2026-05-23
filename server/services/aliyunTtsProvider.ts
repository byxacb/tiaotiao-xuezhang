import { fetchWithTimeout, isConfigured } from "./http";
import type { TtsRequest, TtsResponse } from "./types";

export function createAliyunTtsProvider() {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.ALIYUN_API_KEY || process.env.ALIBABA_API_KEY;
  const baseUrl = process.env.ALIYUN_TTS_BASE_URL || "https://dashscope.aliyuncs.com/api/v1";
  const model = process.env.ALIYUN_TTS_MODEL || "qwen3-tts-flash";
  const voice = process.env.ALIYUN_TTS_VOICE || "Mochi";
  const languageType = process.env.ALIYUN_TTS_LANGUAGE || "Chinese";

  return {
    async tts(request: TtsRequest): Promise<TtsResponse> {
      if (!isConfigured(apiKey)) throw new Error("Aliyun DashScope API key missing");
      const input: Record<string, unknown> = {
        text: request.text.slice(0, 600),
        voice: request.voiceId || voice,
        language_type: languageType
      };
      if (model.includes("instruct")) {
        input.instructions =
          "你是给乡村孩子讲故事的跳跳学长，语气温暖、亲近、自然，像晚饭后坐在院子里陪孩子慢慢解释问题。";
        input.optimize_instructions = true;
      }
      const response = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/services/aigc/multimodal-generation/generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          input
        })
      }, 35000);

      if (!response.ok) throw new Error(`Aliyun TTS failed: ${response.status}`);
      const data = await response.json();
      const audio = data?.output?.audio;
      const audioBase64 = audio?.data || data?.data?.audio || data?.audio;
      const audioUrl = audio?.url || data?.url;
      if (!audioBase64 && !audioUrl) throw new Error("Aliyun TTS returned no audio");

      return {
        audioBase64,
        audioUrl,
        mimeType: audioUrl?.endsWith(".wav") ? "audio/wav" : "audio/mpeg",
        text: request.text,
        meta: { source: "aliyun", fallback: false }
      };
    }
  };
}
