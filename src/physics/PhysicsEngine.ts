import { CharacterState } from "../types/state";
import { PhysicsConfig } from "../types/config";
import { WorldModel } from "../world/WorldModel";
import { CollisionDetector } from "./CollisionDetector";
import { CollisionResolver, CollisionResult } from "./CollisionResolver";
import { clamp } from "../utils/math";

export class PhysicsEngine {
  public config: Required<PhysicsConfig>;
  private detector: CollisionDetector;
  private resolver: CollisionResolver;

  constructor(config: PhysicsConfig = {}) {
    this.config = {
      gravity: config.gravity ?? 700,
      maxFallSpeed: config.maxFallSpeed ?? 800,
      walkSpeed: config.walkSpeed ?? 90,
      runSpeed: config.runSpeed ?? 180,
      jumpImpulse: config.jumpImpulse ?? 320,
      collisionPadding: config.collisionPadding ?? 2
    };

    this.detector = new CollisionDetector();
    this.resolver = new CollisionResolver();
  }

  applyGravity(character: CharacterState, dt: number): void {
    if (!character.grounded || character.vy < 0) {
      character.vy = clamp(
        character.vy + this.config.gravity * dt,
        -this.config.maxFallSpeed,
        this.config.maxFallSpeed
      );
    }
  }

  resolveCollisions(character: CharacterState, world: WorldModel): CollisionResult {
    const collisions = this.detector.detect(character, world, this.config.collisionPadding);
    const result = this.resolver.resolve(character, collisions);
    character.grounded = result.grounded;
    return result;
  }

  update(character: CharacterState, world: WorldModel, dt: number): CollisionResult {
    // 1. Advance horizontal position
    character.x += character.vx * dt;

    // 2. Continuous Ground Check to prevent gravity jitter when standing on platform
    if (character.grounded && character.vy >= 0) {
      // Find current platform directly beneath character feet
      const footX = character.x + character.width / 2;
      const footY = character.y + character.height;
      const ground = world.getGroundBelow(footX, footY - 4, 10);

      if (ground && character.x + character.width > ground.x + 2 && character.x < ground.x + ground.width - 2) {
        // Firmly lock onto platform top without vertical oscillation
        character.y = ground.y - character.height;
        character.vy = 0;
        character.grounded = true;
      } else {
        // Character walked off platform edge
        character.grounded = false;
      }
    }

    // 3. If in air or jumping, apply gravity and advance vertical position
    if (!character.grounded || character.vy < 0) {
      this.applyGravity(character, dt);
      character.y += character.vy * dt;

      // Resolve landing collisions
      const result = this.resolveCollisions(character, world);

      // Clamp horizontal bounds
      this.clampToBounds(character, world);

      // Recovery check if fallen outside
      this.checkTrappedRecovery(character, world);

      return result;
    }

    // Clamp horizontal bounds
    this.clampToBounds(character, world);

    return {
      grounded: true,
      landed: false,
      hitWall: false,
      falling: false,
      correction: { x: 0, y: 0 }
    };
  }

  private checkTrappedRecovery(character: CharacterState, world: WorldModel): void {
    if (
      isNaN(character.x) ||
      isNaN(character.y) ||
      character.y > world.bounds.maxY + 200 ||
      character.y < world.bounds.minY - 200
    ) {
      const safe = world.findSafeSpawn(character.width, character.height);
      character.x = safe.x;
      character.y = safe.y;
      character.vx = 0;
      character.vy = 0;
      character.grounded = true;
    }
  }

  private clampToBounds(character: CharacterState, world: WorldModel): void {
    const minX = world.bounds.minX;
    const maxX = world.bounds.maxX - character.width;

    if (character.x < minX) {
      character.x = minX;
      if (character.vx < 0) character.vx = 0;
    } else if (character.x > maxX) {
      character.x = maxX;
      if (character.vx > 0) character.vx = 0;
    }
  }
}
