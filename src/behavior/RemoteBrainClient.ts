import { BrainDecision, BrainRequest } from "../types/behavior";

export class RemoteBrainClient {
  public endpoint: string;
  public apiKey?: string;
  private activeControllers: Map<string, AbortController> = new Map();

  constructor(endpoint: string = "/v1/behaviors/decide", apiKey?: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async decide(request: BrainRequest, timeoutMs: number = 3000): Promise<BrainDecision | null> {
    if (!this.endpoint || typeof fetch === "undefined") {
      return null;
    }

    const controller = new AbortController();
    const requestId = `${request.characterId}-${Date.now()}`;
    this.activeControllers.set(requestId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const res = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.activeControllers.delete(requestId);

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data && typeof data.action === "string") {
        return {
          action: data.action,
          durationMs: data.durationMs || 2000,
          target: data.target,
          confidence: data.confidence || 0.8
        };
      }

      return null;
    } catch {
      clearTimeout(timeoutId);
      this.activeControllers.delete(requestId);
      return null;
    }
  }

  abort(requestId: string): void {
    const controller = this.activeControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(requestId);
    }
  }

  abortAll(): void {
    for (const controller of this.activeControllers.values()) {
      controller.abort();
    }
    this.activeControllers.clear();
  }
}
