import { ActionState } from "./enums";
import { CharacterState, Personality, Vector2 } from "./state";
import { WorldModel } from "../world/WorldModel";
import { InteractionSnapshot } from "./events";
import { RecentActionLog } from "../behavior/RecentActionLog";

export interface BehaviorAction {
  name: ActionState | string;
  score: number;
  durationMs: number;
  target?: string;
  data?: Record<string, unknown>;
}

export interface BehaviorContextSummary {
  currentAction: string;
  energy: number;
  grounded: boolean;
  nearbySurfaceCount: number;
  recentActions: string[];
}

export interface BrainRequest {
  characterId: string;
  context: BehaviorContextSummary;
  allowedActions: string[];
}

export interface BrainDecision {
  action: string;
  durationMs: number;
  target?: string;
  confidence?: number;
}

export interface BehaviorContext {
  character: CharacterState;
  personality: Personality;
  world: WorldModel;
  interactions: InteractionSnapshot;
  history: RecentActionLog;
  energy: number;
  boredom: number;
  novelty: number;
}

export interface CharacterSkillContext {
  character: CharacterState;
  world: WorldModel;
  target?: Element | Vector2 | null;
  say: (text: string, durationMs?: number) => void;
  teleport: (x: number, y: number) => void;
  jump: () => boolean;
  bark: () => boolean;
  walk: () => boolean;
  sleep: () => boolean;
  do: (action: string) => boolean;
}

export interface CharacterSkill {
  name: string;
  description?: string;
  cooldownMs?: number;
  execute: (context: CharacterSkillContext, ...args: any[]) => void | Promise<void>;
}
