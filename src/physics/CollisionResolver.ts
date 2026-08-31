import { CharacterState, Vector2 } from "../types/state";
import { CollisionType } from "../types/enums";
import { Collision } from "./CollisionDetector";

export interface CollisionResult {
  grounded: boolean;
  landed: boolean;
  hitWall: boolean;
  falling: boolean;
  correction: Vector2;
}

export class CollisionResolver {
  resolve(body: CharacterState, collisions: Collision[]): CollisionResult {
    let grounded = false;
    let landed = false;
    let hitWall = false;
    const correction: Vector2 = { x: 0, y: 0 };
    const wasGrounded = body.grounded;

    for (const collision of collisions) {
      if (collision.type === CollisionType.FLOOR) {
        grounded = true;
        if (!wasGrounded && body.vy >= 0) {
          landed = true;
        }

        // Lock vertically to surface top directly to eliminate floating-point jitter
        body.y = collision.surface.y - body.height;
        body.vy = 0;
      } else if (collision.type === CollisionType.WALL) {
        hitWall = true;
        if (collision.normal.x < 0) {
          // Hit left wall while moving right
          body.x = collision.surface.x - body.width;
          body.vx = 0;
        } else if (collision.normal.x > 0) {
          // Hit right wall while moving left
          body.x = collision.surface.x + collision.surface.width;
          body.vx = 0;
        }
      }
    }

    const falling = !grounded && body.vy > 0;

    return {
      grounded,
      landed,
      hitWall,
      falling,
      correction
    };
  }
}
