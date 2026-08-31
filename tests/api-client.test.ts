import { describe, it, expect, vi } from "vitest";
import { LivingWebAPIClient } from "../src/api/LivingWebAPIClient";

describe("LivingWebAPIClient", () => {
  it("initializes with base url and api key", () => {
    const client = new LivingWebAPIClient("https://api.living-web.dev/", "test-key");
    expect(client.baseUrl).toBe("https://api.living-web.dev");
    expect(client.apiKey).toBe("test-key");
  });

  it("handles getCharacter network call gracefully", async () => {
    const client = new LivingWebAPIClient();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "char-1", species: "dog", personality: { energy: 0.7 } })
    }) as any;

    const char = await client.getCharacter("char-1");
    expect(char).toBeDefined();
    expect(char?.id).toBe("char-1");
  });

  it("handles remote decision requests", async () => {
    const client = new LivingWebAPIClient();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ action: "bark", durationMs: 1500, confidence: 0.95 })
    }) as any;

    const decision = await client.decide({
      characterId: "char-1",
      context: { currentAction: "idle", energy: 0.8, grounded: true, nearbySurfaceCount: 2, recentActions: [] },
      allowedActions: ["bark", "walk"]
    });

    expect(decision?.action).toBe("bark");
    expect(decision?.durationMs).toBe(1500);
  });
});
