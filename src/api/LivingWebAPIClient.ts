import { AssetManifest } from "../types/animation";
import { BrainDecision, BrainRequest } from "../types/behavior";
import { Personality } from "../types/state";

export interface CharacterProfile {
  id: string;
  name?: string;
  species: string;
  personality: Personality;
  assets?: AssetManifest;
  policyVersion?: string;
}

export interface BehaviorProfile {
  id: string;
  policyVersion: string;
  actionWeights: Record<string, number>;
  cooldowns: Record<string, number>;
}

export class LivingWebAPIClient {
  public baseUrl: string;
  public apiKey?: string;

  constructor(baseUrl: string = "https://api.living-web.dev", apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async getCharacter(id: string): Promise<CharacterProfile | null> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/characters/${id}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async createCharacter(profile: CharacterProfile): Promise<CharacterProfile | null> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/characters`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(profile)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getBehaviorProfile(id: string): Promise<BehaviorProfile | null> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/characters/${id}/profile`, {
        headers: this.getHeaders()
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async decide(request: BrainRequest): Promise<BrainDecision | null> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/behaviors/decide`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
