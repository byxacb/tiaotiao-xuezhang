export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function isConfigured(value: string | undefined) {
  return Boolean(value && !value.startsWith("your_") && value.trim().length > 8);
}

export function stripDataUrl(dataUrl: string) {
  return dataUrl.replace(/^data:[^;]+;base64,/, "");
}
