import { CharacterState, Vector2 } from "../types/state";
import { CollisionType, SurfaceType } from "../types/enums";
import { WorldModel } from "../world/WorldModel";
import { WorldSurface } from "../types/world";

export interface Collision {
  type: CollisionType;
  surface: WorldSurface;
  normal: Vector2;
  penetration: number;
}

export class CollisionDetector {
  detect(body: CharacterState, world: WorldModel, padding: number = 2): Collision[] {
    const collisions: Collision[] = [];
    const bodyRect = {
      x: body.x,
      y: body.y,
      width: body.width,
      height: body.height
    };

    const nearby = world.getNearbySurfaces(bodyRect, 40);
    const bodyBottom = body.y + body.height;

    let bestFloorSurface: WorldSurface | null = null;
    let minFloorDistance = Infinity;

    for (const surface of nearby) {
      if (surface.type === SurfaceType.IGNORE || surface.type === SurfaceType.HAZARD) {
        continue;
      }

      // Explicit walls take precedence for lateral blocking
      if (surface.type === SurfaceType.WALL) {
        const verticalOverlap =
          bodyBottom > surface.y + 4 &&
          body.y < surface.y + surface.height - 4;

        if (verticalOverlap) {
          if (body.x + body.width >= surface.x && body.x < surface.x && body.vx > 0) {
            collisions.push({
              type: CollisionType.WALL,
              surface,
              normal: { x: -1, y: 0 },
              penetration: Math.min(16, body.x + body.width - surface.x)
            });
          } else if (body.x <= surface.x + surface.width && body.x + body.width > surface.x + surface.width && body.vx < 0) {
            collisions.push({
              type: CollisionType.WALL,
              surface,
              normal: { x: 1, y: 0 },
              penetration: Math.min(16, surface.x + surface.width - body.x)
            });
          }
        }
        continue;
      }

      // Floor / Platform Landing Check
      // Standard DOM elements act as one-way top landing surfaces
      const horizontalOverlap =
        body.x + body.width > surface.x + padding &&
        body.x < surface.x + surface.width - padding;

      if (horizontalOverlap) {
        const surfaceTop = surface.y;
        // Landing window: near top lip and moving down or level
        if (bodyBottom >= surfaceTop - 6 && bodyBottom <= surfaceTop + 24 && body.vy >= -60) {
          const dist = Math.abs(bodyBottom - surfaceTop);
          if (dist < minFloorDistance) {
            minFloorDistance = dist;
            bestFloorSurface = surface;
          }
        }
      }
    }

    // Add only the single best floor collision to prevent stacking penetration jitters
    if (bestFloorSurface) {
      collisions.push({
        type: CollisionType.FLOOR,
        surface: bestFloorSurface,
        normal: { x: 0, y: -1 },
        penetration: bodyBottom - bestFloorSurface.y
      });
    }

    return collisions;
  }
}
