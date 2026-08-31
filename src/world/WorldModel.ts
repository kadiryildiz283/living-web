import { Rect, Vector2 } from "../types/state";
import { Direction, SurfaceType } from "../types/enums";
import { InteractionZone, WorldBounds, WorldSurface } from "../types/world";
import { distance, rectIntersects } from "../utils/math";

export interface ObstacleAhead {
  surface: WorldSurface;
  heightDiff: number; // positive = step is higher than feet
  gap: number;        // horizontal distance to start of surface
  type: "step_up" | "step_down" | "gap" | "wall";
}

export class WorldModel {
  public bounds: WorldBounds = { minX: 0, minY: 0, maxX: 1280, maxY: 800 };
  public surfaces: WorldSurface[] = [];
  public zones: InteractionZone[] = [];

  constructor(
    surfaces: WorldSurface[] = [],
    bounds: WorldBounds = { minX: 0, minY: 0, maxX: 1280, maxY: 800 },
    zones: InteractionZone[] = []
  ) {
    this.surfaces = surfaces;
    this.bounds = bounds;
    this.zones = zones;
  }

  getNearbySurfaces(rect: Rect, padding: number = 50): WorldSurface[] {
    const searchArea: Rect = {
      x: rect.x - padding,
      y: rect.y - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    };

    return this.surfaces.filter((surface) => {
      const surfaceRect: Rect = {
        x: surface.x,
        y: surface.y,
        width: surface.width,
        height: surface.height
      };
      return rectIntersects(searchArea, surfaceRect);
    });
  }

  getGroundBelow(x: number, y: number, maxDistance: number = 2000): WorldSurface | null {
    let closestSurface: WorldSurface | null = null;
    let minDistance = maxDistance;

    for (const surface of this.surfaces) {
      if (surface.type === SurfaceType.IGNORE || surface.type === SurfaceType.HAZARD) {
        continue;
      }

      // Check if x coordinate is within horizontal bounds of the surface
      if (x >= surface.x - 5 && x <= surface.x + surface.width + 5) {
        const distanceToTop = surface.y - y;
        if (distanceToTop >= -4 && distanceToTop < minDistance) {
          minDistance = distanceToTop;
          closestSurface = surface;
        }
      }
    }

    return closestSurface;
  }

  /**
   * Looks ahead in the character's movement direction to detect stairs, obstacles, or platforms to jump onto
   */
  findObstacleAhead(
    x: number,
    y: number,
    width: number,
    height: number,
    direction: Direction,
    lookaheadDistance: number = 90
  ): ObstacleAhead | null {
    const footY = y + height;
    const isRight = direction === Direction.RIGHT;

    // Filter surfaces that lie ahead in the movement direction
    for (const surface of this.surfaces) {
      if (surface.type === SurfaceType.IGNORE || surface.type === SurfaceType.HAZARD) {
        continue;
      }

      // Skip current floor under feet
      if (Math.abs(surface.y - footY) < 4 && x >= surface.x - 5 && x + width <= surface.x + surface.width + 5) {
        continue;
      }

      const gap = isRight ? surface.x - (x + width) : x - (surface.x + surface.width);
      const heightDiff = footY - surface.y; // Positive if surface is higher than feet

      // Surface is ahead within lookahead range
      if (gap >= -15 && gap <= lookaheadDistance) {
        // Step Up (Stairs / Obstacle ahead)
        if (heightDiff > 8 && heightDiff <= 140) {
          return {
            surface,
            heightDiff,
            gap: Math.max(0, gap),
            type: "step_up"
          };
        }
        // Jumpable Gap to platform
        if (Math.abs(heightDiff) <= 40 && gap > 15 && gap <= lookaheadDistance) {
          return {
            surface,
            heightDiff,
            gap,
            type: "gap"
          };
        }
        // High Wall (Cannot jump directly)
        if (heightDiff > 140) {
          return {
            surface,
            heightDiff,
            gap: Math.max(0, gap),
            type: "wall"
          };
        }
      }
    }

    return null;
  }

  /**
   * Finds nearest attractor zone within range
   */
  findNearbyAttractor(x: number, y: number, maxDist: number = 500): InteractionZone | null {
    let closestZone: InteractionZone | null = null;
    let minDist = maxDist;

    for (const zone of this.zones) {
      const zoneCenter = {
        x: zone.bounds.x + zone.bounds.width / 2,
        y: zone.bounds.y + zone.bounds.height / 2
      };
      const dist = distance({ x, y }, zoneCenter);
      if (dist < minDist) {
        minDist = dist;
        closestZone = zone;
      }
    }

    return closestZone;
  }

  findSafeSpawn(characterWidth: number = 40, characterHeight: number = 40): Vector2 {
    const candidates = this.surfaces
      .filter((s) => s.type === SurfaceType.PLATFORM && s.width >= characterWidth)
      .sort((a, b) => b.priority - a.priority || a.y - b.y);

    if (candidates.length > 0) {
      const best = candidates[0];
      return {
        x: Math.max(best.x + 10, Math.min(best.x + best.width / 2, best.x + best.width - characterWidth - 10)),
        y: Math.max(0, best.y - characterHeight)
      };
    }

    const groundY = Math.max(100, this.bounds.maxY - characterHeight - 20);
    return {
      x: Math.max(50, this.bounds.minX + 100),
      y: groundY
    };
  }
}
