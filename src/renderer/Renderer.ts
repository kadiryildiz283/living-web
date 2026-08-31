import { Direction } from "../types/enums";
import { CameraState, Vector2, ViewportState } from "../types/state";
import { WorldSurface } from "../types/world";

export interface SpeechBubbleState {
  text: string;
  expiresAt: number;
}

export interface CharacterRenderState {
  id: string;
  position: Vector2;
  width: number;
  height: number;
  animation: string;
  frameIndex: number;
  direction: Direction;
  opacity: number;
  frameImage?: any;
  speech?: SpeechBubbleState;
  vx?: number;
  vy?: number;
  grounded?: boolean;
}

export interface RenderFrame {
  characters: CharacterRenderState[];
  camera: CameraState;
  viewport: ViewportState;
  debugSurfaces?: WorldSurface[];
  debugMode?: boolean;
}

export interface Renderer {
  initialize(container?: HTMLElement | null): void;
  render(frame: RenderFrame): void;
  resize(viewport: ViewportState): void;
  destroy(): void;
}
