import { tts } from "./api";

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
}

export async function speak(text: string) {
  stopSpeaking();
  try {
    const result = await tts(text);
    if (result.audioBase64) {
      const src = `data:${result.mimeType || "audio/mpeg"};base64,${result.audioBase64}`;
      currentAudio = new Audio(src);
      await currentAudio.play();
      return "api";
    }
    if (result.audioUrl) {
      currentAudio = new Audio(result.audioUrl);
      await currentAudio.play();
      return "api";
    }
  } catch {
    // Browser speech is the fallback. Keep this silent to avoid disrupting children.
  }

  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
    return "browser";
  }

  return "none";
}
