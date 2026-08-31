import { ActionState, Direction } from "./enums";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Personality {
  energy: number;
  curiosity: number;
  friendliness: number;
  playfulness: number;
  bravery: number;
  laziness: number;
}

export interface CharacterState {
  id: string;
  name: string;
  species: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  direction: Direction;
  action: ActionState;
  opacity?: number;
}

export interface ViewportState {
  width: number;
  height: number;
  devicePixelRatio: number;
  visible: boolean;
}

export interface CameraState {
  x: number;
  y: number;
}

export interface RuntimeState {
  running: boolean;
  paused: boolean;
  deltaTime: number;
  time: number;
  viewport: ViewportState;
  camera: CameraState;
}
