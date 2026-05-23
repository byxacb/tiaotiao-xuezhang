export type ProviderSource = "minimax" | "ark" | "aliyun" | "volcengine" | "mock";

export type AiResponseMeta = {
  source: ProviderSource;
  fallback: boolean;
  notice?: string;
};

export type ChatMode = "explore" | "reading" | "parent-card" | "quiz";

export type ChildProfile = {
  nickname?: string;
  ageBand?: string;
};

export type ChatRequest = {
  mode: ChatMode;
  message: string;
  childProfile?: ChildProfile;
  context?: Record<string, unknown>;
};

export type ImageStyle = "knowledge-card" | "sticker" | "storybook" | "realistic";

export type ChatImageResult = {
  url: string;
  caption: string;
  style: ImageStyle;
};

export type ChatResponse = {
  encouragement: string;
  diagnosisQuestion: string;
  explanation: string;
  miniTask: string;
  parentTip: string;
  quiz?: QuizQuestion;
  needsImage?: boolean;
  imagePrompt?: string;
  images?: ChatImageResult[];
  meta: AiResponseMeta;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  reason: string;
};

export type TtsRequest = {
  text: string;
  voiceId?: string;
};

export type TtsResponse = {
  audioUrl?: string;
  audioBase64?: string;
  mimeType?: string;
  text: string;
  meta: AiResponseMeta;
};

export type VisionRequest = {
  imageDataUrl: string;
  taskType: "handwriting" | "homework" | "object";
};

export type VisionResponse = {
  praise: string;
  observations: string[];
  improvement: string;
  tryAgain: string;
  parentTip: string;
  meta: AiResponseMeta;
};

export type ImageRequest = {
  prompt: string;
  style: ImageStyle;
};

export type ImageResponse = {
  imageUrl?: string;
  imageBase64?: string;
  prompt: string;
  caption: string;
  meta: AiResponseMeta;
};

export type VideoJobStatus = "queued" | "processing" | "completed" | "failed";

export type VideoJob = {
  id: string;
  status: VideoJobStatus;
  prompt: string;
  progress: number;
  videoUrl?: string;
  message: string;
  meta: AiResponseMeta;
  createdAt: number;
};

export interface AiProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  tts(request: TtsRequest): Promise<TtsResponse>;
  vision(request: VisionRequest): Promise<VisionResponse>;
  image(request: ImageRequest): Promise<ImageResponse>;
  createVideoJob(request: { prompt: string }): Promise<VideoJob>;
  getVideoJob(id: string): Promise<VideoJob>;
}
