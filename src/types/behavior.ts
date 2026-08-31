import { ActionState } from "./enums";
import { CharacterState, Personality } from "./state";
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
