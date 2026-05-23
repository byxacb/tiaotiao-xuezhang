import type { ChatResponse, ImageResponse, VideoJob, VisionResponse } from "../types";

async function requestJson<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    ...init
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || `请求失败：${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function chat(body: {
  mode: "explore" | "reading" | "parent-card" | "quiz";
  message: string;
  childProfile?: { nickname?: string; ageBand?: string };
  context?: Record<string, unknown>;
}) {
  return requestJson<ChatResponse>("/api/chat", body);
}

export function health() {
  return requestJson<{
    ok: boolean;
    providerMode: string;
    hasMiniMax: boolean;
    hasArk: boolean;
    hasAliyunTts: boolean;
    hasVolcTts: boolean;
    preferredTts: string;
  }>("/api/health");
}

export function tts(text: string) {
  return requestJson<{ audioBase64?: string; audioUrl?: string; mimeType?: string; text: string }>("/api/tts", {
    text
  });
}

export function vision(imageDataUrl: string, taskType: "handwriting" | "homework" | "object" = "handwriting") {
  return requestJson<VisionResponse>("/api/vision", { imageDataUrl, taskType });
}

export function generateImage(prompt: string, style: "knowledge-card" | "sticker" | "storybook") {
  return requestJson<ImageResponse>("/api/image", { prompt, style });
}

export function createVideo(prompt: string) {
  return requestJson<VideoJob>("/api/video/jobs", { prompt });
}

export function getVideoJob(id: string) {
  return requestJson<VideoJob>(`/api/video/jobs/${id}`);
}
