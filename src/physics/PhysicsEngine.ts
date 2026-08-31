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

      // Enforce strict world boundaries (prevent escaping above .html or below document)
      this.clampToBounds(character, world);

      // Recovery check if fallen outside
      this.checkTrappedRecovery(character, world);

      return result;
    }

    // Enforce strict world boundaries
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
    // 1. Strict Horizontal Boundaries
    const minX = Math.max(0, world.bounds.minX);
    const maxX = Math.max(minX + 50, world.bounds.maxX - character.width);

    if (character.x < minX) {
      character.x = minX;
      if (character.vx < 0) character.vx = 0;
    } else if (character.x > maxX) {
      character.x = maxX;
      if (character.vx > 0) character.vx = 0;
    }

    // 2. Strict Top Ceiling (NEVER allow escaping above HTML / window top edge)
    const minY = 0;
    if (character.y < minY) {
      character.y = minY;
      if (character.vy < 0) {
        character.vy = 0; // Bonk ceiling and fall back down
      }
    }

    // 3. Strict Bottom Floor (Never allow falling below HTML document bottom)
    const maxY = Math.max(100, world.bounds.maxY - character.height);
    if (character.y > maxY) {
      character.y = maxY;
      character.vy = 0;
      character.grounded = true;
    }
  }
}
