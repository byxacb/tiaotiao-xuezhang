import { buildChatPrompt, buildVisionPrompt } from "./prompts";
import { fetchWithTimeout, stripDataUrl } from "./http";
import type { ChatRequest, ChatResponse, VisionRequest, VisionResponse } from "./types";

type ChatProviderConfig = {
  source: "minimax" | "ark";
  apiKey: string;
  baseUrl: string;
  model: string;
};

function parseJsonObject(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  if (start >= 0) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < cleaned.length; index += 1) {
      const char = cleaned[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === "\"") {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth === 0) {
        return JSON.parse(cleaned.slice(start, index + 1));
      }
    }
  }
  return JSON.parse(cleaned);
}

function normalizeChatResponse(value: unknown, source: "minimax" | "ark"): ChatResponse {
  const raw = value as Record<string, unknown>;
  const quiz = raw.quiz as Record<string, unknown> | undefined;
  const validQuiz = quiz?.answer && Array.isArray(quiz.options) && quiz.options.includes(quiz.answer) ? quiz : undefined;
  const dedupedOptions = validQuiz ? Array.from(new Set(validQuiz.options as string[])).slice(0, 4) : [];
  const needsImage = typeof raw.needsImage === "boolean" ? raw.needsImage : false;
  const imagePrompt = typeof raw.imagePrompt === "string" ? raw.imagePrompt.slice(0, 40) : undefined;

  return {
    encouragement: (raw.encouragement as string) || "你愿意开口问问题，这已经很棒了。",
    diagnosisQuestion: (raw.diagnosisQuestion as string) || "你觉得这个问题最像生活里的哪件事？",
    explanation: (raw.explanation as string) || "我们先从一个小点开始理解，再慢慢把它连成完整答案。",
    miniTask: (raw.miniTask as string) || "试着把今天学到的内容讲给家人听一遍。",
    parentTip: (raw.parentTip as string) || "家长可以先听孩子说完，再补一句自己的观察。",
    quiz:
      validQuiz && dedupedOptions.includes(validQuiz.answer as string)
        ? {
            question: (validQuiz.question as string) || "",
            options: dedupedOptions as string[],
            answer: validQuiz.answer as string,
            reason: (validQuiz.reason as string) || ""
          }
        : undefined,
    needsImage,
    imagePrompt: needsImage ? imagePrompt : undefined,
    meta: {
      source,
      fallback: false
    }
  };
}

export async function callOpenAiChat(config: ChatProviderConfig, request: ChatRequest): Promise<ChatResponse> {
  const response = await fetchWithTimeout(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: buildChatPrompt(request),
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`${config.source} chat failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${config.source} chat returned empty content`);
  }

  return normalizeChatResponse(parseJsonObject(content), config.source);
}

export async function callArkVision(config: ChatProviderConfig, request: VisionRequest): Promise<VisionResponse> {
  const response = await fetchWithTimeout(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildVisionPrompt(request.taskType) },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${stripDataUrl(request.imageDataUrl)}`
              }
            }
          ]
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`ark vision failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const raw = parseJsonObject(content);
  return {
    praise: raw.praise || "你有认真完成，这一点很值得表扬。",
    observations: Array.isArray(raw.observations) ? raw.observations.slice(0, 3) : ["图片内容已经收到。"],
    improvement: raw.improvement || "下一次可以慢一点，把最关键的一处写稳。",
    tryAgain: raw.tryAgain || "挑一个地方再试一次，只改一个小目标。",
    parentTip: raw.parentTip || "家长可以先夸努力，再陪孩子选一个小地方改。",
    meta: {
      source: "ark",
      fallback: false
    }
  };
}
