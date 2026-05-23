import type { AppState, ConsentState, LearningRecord, SavedPicture } from "../types";

const STORAGE_KEY = "tiaotiao-state-v1";

export const defaultConsent: ConsentState = {
  accepted: false,
  nickname: "",
  ageBand: "6-8岁"
};

export const defaultState: AppState = {
  schemaVersion: 1,
  consent: defaultConsent,
  records: [],
  readingProgress: {},
  pictureBook: []
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...defaultState,
      ...parsed,
      schemaVersion: 1,
      consent: { ...defaultConsent, ...parsed.consent },
      records: Array.isArray(parsed.records) ? parsed.records : [],
      readingProgress: parsed.readingProgress ?? {},
      pictureBook: Array.isArray(parsed.pictureBook) ? parsed.pictureBook : []
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function createRecord(record: Omit<LearningRecord, "id" | "createdAt">): LearningRecord {
  return {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
}

export function createSavedPicture(picture: Omit<SavedPicture, "id" | "savedAt">): SavedPicture {
  return {
    ...picture,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString()
  };
}
