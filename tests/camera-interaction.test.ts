import { describe, it, expect } from "vitest";
import { CameraController } from "../src/camera/CameraController";
import { InteractionManager } from "../src/interaction/InteractionManager";
import { CharacterState } from "../src/types/state";
import { ActionState, Direction } from "../src/types/enums";

describe("CameraController", () => {
  it("translates world coordinates to screen coordinates based on scroll offset", () => {
    const camera = new CameraController(0, 0);
    camera.update(100, 200);

    const worldPos = { x: 300, y: 500 };
    const screenPos = camera.worldToScreen(worldPos);

    expect(screenPos.x).toBe(200); // 300 - 100
    expect(screenPos.y).toBe(300); // 500 - 200

    const backToWorld = camera.screenToWorld(screenPos);
    expect(backToWorld.x).toBe(300);
    expect(backToWorld.y).toBe(500);
  });
});

describe("InteractionManager", () => {
  it("tracks pointer proximity and over state", () => {
    const manager = new InteractionManager({ draggable: true });
    const character: CharacterState = {
      id: "char-1",
      name: "Boncuk",
      species: "dog",
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      width: 40,
      height: 40,
      grounded: true,
      direction: Direction.RIGHT,
      action: ActionState.IDLE
    };

    // Update with far pointer
    (manager as any).pointerPosition = { x: 500, y: 500 };
    manager.update(character, 0, 0);
    let snapshot = manager.getSnapshot();
    expect(snapshot.pointerNear).toBe(false);
    expect(snapshot.pointerOver).toBe(false);

    // Update with near pointer
    (manager as any).pointerPosition = { x: 120, y: 120 };
    manager.update(character, 0, 0);
    snapshot = manager.getSnapshot();
    expect(snapshot.pointerNear).toBe(true);
    expect(snapshot.pointerOver).toBe(true);
  });
});
