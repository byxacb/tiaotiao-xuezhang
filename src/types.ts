export type AgeBand = "6-8岁" | "9-10岁" | "11-12岁";

export type ConsentState = {
  accepted: boolean;
  nickname: string;
  ageBand: AgeBand;
  acceptedAt?: string;
};

export type ApiMeta = {
  source: "minimax" | "ark" | "mock";
  fallback: boolean;
  notice?: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  reason: string;
};

export type ChatImageResult = {
  url: string;
  caption: string;
  style: "storybook" | "realistic" | "knowledge-card";
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
  meta: ApiMeta;
};

export type VisionResponse = {
  praise: string;
  observations: string[];
  improvement: string;
  tryAgain: string;
  parentTip: string;
  meta: ApiMeta;
};

export type ImageResponse = {
  imageUrl?: string;
  imageBase64?: string;
  prompt: string;
  caption: string;
  meta: ApiMeta;
};

export type VideoJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  prompt: string;
  progress: number;
  videoUrl?: string;
  message: string;
  meta: ApiMeta;
  createdAt: number;
};

export type SavedPicture = {
  id: string;
  url: string;
  caption: string;
  style: "storybook" | "realistic" | "knowledge-card";
  topic: string;
  savedAt: string;
};

export type LearningRecord = {
  id: string;
  type: "chat" | "reading" | "vision" | "image" | "video" | "quiz";
  title: string;
  summary: string;
  createdAt: string;
  source: ApiMeta["source"];
};

export type AppState = {
  schemaVersion: 1;
  consent: ConsentState;
  records: LearningRecord[];
  readingProgress: Record<string, number>;
  pictureBook: SavedPicture[];
};
