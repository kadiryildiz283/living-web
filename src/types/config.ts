import { AssetSource } from "./animation";
import { Personality } from "./state";

export interface PersonalityConfig {
  energy?: number;
  curiosity?: number;
  friendliness?: number;
  playfulness?: number;
  bravery?: number;
  laziness?: number;
}

export interface WorldConfig {
  autoDetect?: boolean;
  useSemanticElements?: boolean;
  ignoredSelectors?: string[];
  platformSelectors?: string[];
  scanIntervalMs?: number;
}

export interface BehaviorConfig {
  localAI?: boolean;
  remoteAI?: "disabled" | "optional" | "required";
  decisionIntervalMs?: number;
  actionCooldownMs?: number;
  apiEndpoint?: string;
  apiKey?: string;
}

export interface InteractionConfig {
  draggable?: boolean;
  clickActions?: boolean;
  hoverActions?: boolean;
  followPointer?: boolean;
}

export interface PhysicsConfig {
  gravity?: number;
  maxFallSpeed?: number;
  walkSpeed?: number;
  runSpeed?: number;
  jumpImpulse?: number;
  collisionPadding?: number;
}

export interface RuntimeConfig {
  targetFPS?: number;
  reducedMotionAware?: boolean;
  maxCharacters?: number;
  debug?: boolean;
}

export interface PetConfig {
  name?: string;
  species?: string;
  assets: AssetSource;
  personality?: PersonalityConfig;
  world?: WorldConfig;
  behavior?: BehaviorConfig;
  interactions?: InteractionConfig;
  physics?: PhysicsConfig;
  customCanvas?: HTMLCanvasElement;
  rootElement?: HTMLElement | Element;
}
