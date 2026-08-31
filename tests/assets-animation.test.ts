import { describe, it, expect } from "vitest";
import { FrameCache } from "../src/assets/FrameCache";
import { AssetManager } from "../src/assets/AssetManager";
import { AnimationController } from "../src/animation/AnimationController";
import { Direction } from "../src/types/enums";

describe("FrameCache", () => {
  it("stores, retrieves, and clears cached frames", () => {
    const cache = new FrameCache();
    expect(cache.size).toBe(0);

    const mockImg = { src: "idle-1.webp" };
    cache.set("idle-1.webp", mockImg);
    expect(cache.has("idle-1.webp")).toBe(true);
    expect(cache.get("idle-1.webp")).toBe(mockImg);
    expect(cache.size).toBe(1);

    cache.delete("idle-1.webp");
    expect(cache.has("idle-1.webp")).toBe(false);

    cache.set("test", {});
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

describe("AssetManager", () => {
  it("loads manifest from path convention", async () => {
    const manager = new AssetManager();
    const manifest = await manager.load("/pets/boncuk/");

    expect(manifest).toBeDefined();
    expect(manifest.animations["walk"]).toBeDefined();
    expect(manifest.animations["walk"].frames.length).toBe(3);
    expect(manifest.animations["walk"].frames[0]).toBe("/pets/boncuk/walk-1.webp");
  });

  it("loads explicit manifest object", async () => {
    const manager = new AssetManager();
    const manifest = await manager.load({
      animations: {
        idle: { name: "idle", frames: ["custom-idle.png"], fps: 10, loop: true, frameDurationMs: 100 }
      }
    });

    expect(manager.get("idle")).toBeDefined();
    expect(manager.get("idle")?.frames[0]).toBe("custom-idle.png");
  });

  it("resolves animations with fallback hierarchy", async () => {
    const manager = new AssetManager();
    await manager.load({
      animations: {
        idle: { name: "idle", frames: ["idle.png"], fps: 10, loop: true, frameDurationMs: 100 },
        walk: { name: "walk", frames: ["walk.png"], fps: 10, loop: true, frameDurationMs: 100 }
      }
    });

    // run is not present, should fallback to walk
    const runAnim = manager.resolveAnimation("run");
    expect(runAnim?.name).toBe("walk");

    // bark is not present, should fallback to idle
    const barkAnim = manager.resolveAnimation("bark");
    expect(barkAnim?.name).toBe("idle");
  });

  it("preloads and caches images in mock environment", async () => {
    const manager = new AssetManager();
    await manager.load("/pets/boncuk/");
    await manager.preload("walk");

    const cache = manager.getCache();
    expect(cache.has("/pets/boncuk/walk-1.webp")).toBe(true);
  });
});

describe("AnimationController", () => {
  it("advances frames based on delta time", async () => {
    const manager = new AssetManager();
    await manager.load({
      animations: {
        walk: { name: "walk", frames: ["w1", "w2", "w3"], fps: 10, loop: true, frameDurationMs: 100 }
      }
    });

    const controller = new AnimationController(manager);
    controller.play("walk");

    expect(controller.getCurrentFrame()).toBe("w1");

    controller.update(100);
    expect(controller.getCurrentFrame()).toBe("w2");

    controller.update(100);
    expect(controller.getCurrentFrame()).toBe("w3");

    // Loops back to w1
    controller.update(100);
    expect(controller.getCurrentFrame()).toBe("w1");
  });

  it("handles non-looping animations and finishes callback", async () => {
    const manager = new AssetManager();
    await manager.load({
      animations: {
        bark: { name: "bark", frames: ["b1", "b2"], fps: 10, loop: false, frameDurationMs: 100 }
      }
    });

    const controller = new AnimationController(manager);
    let finishedCalled = false;
    controller.play("bark", () => {
      finishedCalled = true;
    });

    controller.update(100);
    expect(controller.getCurrentFrame()).toBe("b2");
    expect(finishedCalled).toBe(true);
    expect(controller.isFinished()).toBe(true);
  });

  it("flips direction correctly", async () => {
    const manager = new AssetManager();
    await manager.load("/pets/boncuk/");
    const controller = new AnimationController(manager);

    expect(controller.direction).toBe(Direction.RIGHT);
    controller.setDirection(Direction.LEFT);
    expect(controller.direction).toBe(Direction.LEFT);
  });
});
