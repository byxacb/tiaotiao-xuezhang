import { randomUUID } from "node:crypto";
import { fetchWithTimeout, isConfigured } from "./http";
import type { TtsRequest, TtsResponse } from "./types";

export function createVolcTtsProvider() {
  const appId = process.env.VOLC_TTS_APP_ID || process.env.DOUBAO_TTS_APP_ID;
  const token = process.env.VOLC_TTS_ACCESS_TOKEN || process.env.DOUBAO_TTS_ACCESS_TOKEN;
  const endpoint = process.env.VOLC_TTS_ENDPOINT || "https://openspeech.bytedance.com/api/v1/tts";
  const cluster = process.env.VOLC_TTS_CLUSTER || "volcano_tts";
  const voiceType = process.env.VOLC_TTS_VOICE_TYPE || process.env.DOUBAO_TTS_VOICE_TYPE;

  return {
    async tts(request: TtsRequest): Promise<TtsResponse> {
      if (!isConfigured(appId) || !isConfigured(token) || !isConfigured(voiceType)) {
        throw new Error("Volcengine TTS not configured");
      }

      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer;${token}`
        },
        body: JSON.stringify({
          app: {
            appid: appId,
            token,
            cluster
          },
          user: {
            uid: "tiaotiao-demo"
          },
          audio: {
            voice_type: request.voiceId || voiceType,
            encoding: "mp3",
            speed_ratio: 0.94,
            volume_ratio: 1,
            pitch_ratio: 1
          },
          request: {
            reqid: randomUUID(),
            text: request.text.slice(0, 450),
            text_type: "plain",
            operation: "query"
          }
        })
      }, 35000);

      if (!response.ok) throw new Error(`Volcengine TTS failed: ${response.status}`);
      const data = await response.json();
      const audioBase64 = data?.data || data?.audio || data?.result?.audio;
      if (!audioBase64) throw new Error("Volcengine TTS returned no audio");

      return {
        audioBase64,
        mimeType: "audio/mpeg",
        text: request.text,
        meta: { source: "volcengine", fallback: false }
      };
    }
  };
}
