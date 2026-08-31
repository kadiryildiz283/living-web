import { describe, it, expect, vi } from "vitest";
import { Scheduler } from "../src/core/Scheduler";
import { GameLoop } from "../src/core/GameLoop";
import { LivingRuntime } from "../src/core/LivingRuntime";
import { LivingWebSDK, livingPet, createPet, createRuntime } from "../src/core/LivingWebSDK";
import { ActionState, Direction } from "../src/types/enums";

describe("Scheduler & GameLoop", () => {
  it("schedules and flushes due tasks", () => {
    const scheduler = new Scheduler();
    let executed = false;

    scheduler.schedule(() => {
      executed = true;
    }, 50);

    // Flush immediately - should not execute yet
    scheduler.flushDue(Date.now());
    expect(executed).toBe(false);

    // Flush after delay
    scheduler.flushDue(Date.now() + 60);
    expect(executed).toBe(true);
  });

  it("handles game loop start, tick, pause, resume, and stop", () => {
    const loop = new GameLoop(60);
    let ticks = 0;
    loop.setFrameCallback(() => {
      ticks++;
    });

    loop.tick(100);
    expect(ticks).toBe(1);

    loop.pause();
    loop.tick(200);
    expect(ticks).toBe(1); // paused, no tick

    loop.resume();
    loop.tick(300);
    expect(ticks).toBe(2);

    loop.stop();
    expect(loop.isRunning).toBe(false);
  });
});

describe("LivingRuntime & PetController & SDK", () => {
  it("initializes character and runtime via createPet", () => {
    const pet = createPet({
      name: "Boncuk",
      assets: "/pets/boncuk/",
      personality: {
        energy: 0.8,
        curiosity: 0.9,
        friendliness: 1.0
      }
    });

    expect(pet).toBeDefined();
    const state = pet.getState();
    expect(state.name).toBe("Boncuk");
    expect(state.action).toBe(ActionState.IDLE);

    // Pet Controller Commands
    pet.say("Hello Living World!");
    expect(pet.getCharacter().speech?.text).toBe("Hello Living World!");

    pet.bark();
    expect(pet.getState().action).toBe(ActionState.BARK);

    pet.setDirection(Direction.LEFT);
    expect(pet.getState().direction).toBe(Direction.LEFT);

    pet.teleport(250, 350);
    expect(pet.getState().x).toBe(250);
    expect(pet.getState().y).toBe(350);

    pet.start();
    expect(pet.getRuntime().state.running).toBe(true);

    pet.pause();
    expect(pet.getRuntime().state.paused).toBe(true);

    pet.resume();
    expect(pet.getRuntime().state.paused).toBe(false);

    pet.stop();
    expect(pet.getRuntime().state.running).toBe(false);

    pet.destroy();
    expect(pet.getRuntime().characters.size).toBe(0);
  });

  it("async factory livingPet preloads and sets up pet", async () => {
    const pet = await livingPet({
      name: "Pamuk",
      species: "cat",
      assets: {
        animations: {
          idle: { name: "idle", frames: ["cat-idle.png"], fps: 8, loop: true, frameDurationMs: 125 }
        }
      }
    });

    expect(pet.getState().name).toBe("Pamuk");
    expect(pet.getState().species).toBe("cat");
  });
});
