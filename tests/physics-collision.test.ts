import { describe, it, expect } from "vitest";
import { PhysicsEngine } from "../src/physics/PhysicsEngine";
import { CollisionDetector } from "../src/physics/CollisionDetector";
import { CollisionResolver } from "../src/physics/CollisionResolver";
import { WorldModel } from "../src/world/WorldModel";
import { CharacterState } from "../src/types/state";
import { ActionState, CollisionType, Direction, SurfaceType } from "../src/types/enums";

describe("Physics & Collisions", () => {
  const createTestBody = (overrides: Partial<CharacterState> = {}): CharacterState => ({
    id: "test-pet",
    name: "Boncuk",
    species: "dog",
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    width: 40,
    height: 40,
    grounded: false,
    direction: Direction.RIGHT,
    action: ActionState.IDLE,
    ...overrides
  });

  it("applies gravity to falling character", () => {
    const physics = new PhysicsEngine({ gravity: 500 });
    const body = createTestBody({ y: 100, vy: 0, grounded: false });

    physics.applyGravity(body, 0.1);
    expect(body.vy).toBe(50); // 0 + 500 * 0.1
  });

  it("detects floor landing collisions", () => {
    const detector = new CollisionDetector();
    const world = new WorldModel([
      {
        id: "ground-1",
        x: 0,
        y: 200,
        width: 500,
        height: 30,
        type: SurfaceType.PLATFORM,
        priority: 1
      }
    ]);

    // Body bottom is at 160 + 40 = 200 (exact top of surface)
    const body = createTestBody({ x: 100, y: 160, vy: 100, grounded: false });
    const collisions = detector.detect(body, world);

    expect(collisions.length).toBe(1);
    expect(collisions[0].type).toBe(CollisionType.FLOOR);
    expect(collisions[0].surface.id).toBe("ground-1");
  });

  it("resolves landing collision and zeroes vertical velocity", () => {
    const resolver = new CollisionResolver();
    const body = createTestBody({ x: 100, y: 162, vy: 100, grounded: false });

    const result = resolver.resolve(body, [
      {
        type: CollisionType.FLOOR,
        surface: {
          id: "ground-1",
          x: 0,
          y: 200,
          width: 500,
          height: 30,
          type: SurfaceType.PLATFORM,
          priority: 1
        },
        normal: { x: 0, y: -1 },
        penetration: 2
      }
    ]);

    expect(result.grounded).toBe(true);
    expect(result.landed).toBe(true);
    expect(body.vy).toBe(0);
    expect(body.y).toBe(160); // 162 - 2
  });

  it("simulates full physics loop: pet falls, lands, and stays grounded", () => {
    const physics = new PhysicsEngine({ gravity: 600 });
    const world = new WorldModel([
      {
        id: "floor",
        x: 0,
        y: 300,
        width: 800,
        height: 50,
        type: SurfaceType.PLATFORM,
        priority: 1
      }
    ]);

    const body = createTestBody({ x: 100, y: 200, vy: 0, grounded: false });

    // Step several frames (enough for body to fall from 200 to 260)
    for (let i = 0; i < 50; i++) {
      physics.update(body, world, 0.016);
    }

    expect(body.grounded).toBe(true);
    expect(body.y).toBe(260); // 300 - 40
    expect(body.vy).toBe(0);
  });

  it("clamps character within horizontal world bounds", () => {
    const physics = new PhysicsEngine();
    const world = new WorldModel([], { minX: 0, minY: 0, maxX: 500, maxY: 500 });
    const body = createTestBody({ x: -50, vx: -100 });

    physics.update(body, world, 0.016);
    expect(body.x).toBe(0);
  });
});
