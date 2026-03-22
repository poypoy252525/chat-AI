import type { AxiosInstance } from "axios";

/**
 * SSE Utility
 * 
 * Handles Server-Sent Events (SSE) from a POST request using an Axios instance.
 * Uses the 'fetch' adapter to get a ReadableStream in the browser.
 */
export async function* streamSSE<T = any>(
  axiosInstance: AxiosInstance,
  url: string,
  data: any,
  signal?: AbortSignal
): AsyncGenerator<T, void, unknown> {
  const response = await axiosInstance.post(url, data, {
    responseType: "stream",
    // @ts-ignore - axios 1.x supports 'fetch' adapter in browser for streams
    adapter: "fetch",
    signal,
  });

  const stream = response.data as ReadableStream;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith("data: ")) {
          const payload = trimmedLine.slice(6).trim();
          
          if (payload === "[DONE]") {
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            yield parsed as T;
          } catch (e) {
            console.warn("Failed to parse SSE payload:", payload, e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
