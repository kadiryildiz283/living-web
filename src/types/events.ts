import { InteractionType } from "./enums";
import { Vector2 } from "./state";

export interface InteractionEvent {
  type: InteractionType;
  timestamp: number;
  position: Vector2;
  metadata?: Record<string, unknown>;
}

export interface InteractionSnapshot {
  pointerNear: boolean;
  pointerOver: boolean;
  dragged: boolean;
  scrolling: boolean;
  lastAction: string;
  pointerPosition?: Vector2;
}

export interface RuntimeEvent {
  type: string;
  payload?: unknown;
}
