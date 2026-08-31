import { Rect, ViewportState } from "./state";
import { SurfaceType } from "./enums";

export interface WorldSurface {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: SurfaceType;
  priority: number;
  source?: Element | null;
}

export interface InteractionZone {
  id: string;
  bounds: Rect;
  type: string;
  attraction: number;
  metadata?: Record<string, unknown>;
}

export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface WorldSnapshot {
  surfaces: WorldSurface[];
  zones?: InteractionZone[];
  viewport: ViewportState;
  timestamp: number;
}
