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

    const nearby = world.getNearbySurfaces(bodyRect, 30);
    const bodyBottom = body.y + body.height;

    let bestFloorSurface: WorldSurface | null = null;
    let minFloorDistance = Infinity;

    for (const surface of nearby) {
      if (surface.type === SurfaceType.IGNORE || surface.type === SurfaceType.HAZARD) {
        continue;
      }

      const horizontalOverlap =
        body.x + body.width > surface.x + padding &&
        body.x < surface.x + surface.width - padding;

      // 1. Check Floor Landing (Only consider downward movement or resting)
      if (horizontalOverlap && body.vy >= 0) {
        const surfaceTop = surface.y;
        // Check if body bottom is near surface top (within landing threshold)
        if (bodyBottom >= surfaceTop - 6 && bodyBottom <= surfaceTop + 18) {
          const dist = Math.abs(bodyBottom - surfaceTop);
          if (dist < minFloorDistance) {
            minFloorDistance = dist;
            bestFloorSurface = surface;
          }
        }
      }

      // 2. Check Wall Collisions (left/right lateral impact)
      const verticalOverlap =
        bodyBottom > surface.y + 6 &&
        body.y < surface.y + surface.height - 6;

      if (verticalOverlap) {
        // Moving right into left wall of surface
        if (body.x + body.width >= surface.x && body.x < surface.x && body.vx > 0) {
          collisions.push({
            type: CollisionType.WALL,
            surface,
            normal: { x: -1, y: 0 },
            penetration: body.x + body.width - surface.x
          });
        }
        // Moving left into right wall of surface
        else if (body.x <= surface.x + surface.width && body.x + body.width > surface.x + surface.width && body.vx < 0) {
          collisions.push({
            type: CollisionType.WALL,
            surface,
            normal: { x: 1, y: 0 },
            penetration: surface.x + surface.width - body.x
          });
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
