import { Rect, Vector2 } from "../types/state";
import { SurfaceType } from "../types/enums";
import { InteractionZone, WorldBounds, WorldSurface } from "../types/world";
import { rectIntersects } from "../utils/math";

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

  findSafeSpawn(characterWidth: number = 40, characterHeight: number = 40): Vector2 {
    // 1. Check if there are valid surfaces with high priority or platforms
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

    // 2. Fallback to bottom of world bounds or default ground
    const groundY = Math.max(100, this.bounds.maxY - characterHeight - 20);
    return {
      x: Math.max(50, this.bounds.minX + 100),
      y: groundY
    };
  }
}
