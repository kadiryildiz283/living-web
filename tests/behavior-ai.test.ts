import { describe, it, expect } from "vitest";
import { StateMachine } from "../src/behavior/StateMachine";
import { UtilityDecisionEngine } from "../src/behavior/UtilityDecisionEngine";
import { RecentActionLog } from "../src/behavior/RecentActionLog";
import { BehaviorController } from "../src/behavior/BehaviorController";
import { ActionState, Direction } from "../src/types/enums";
import { WorldModel } from "../src/world/WorldModel";
import { BehaviorContext } from "../src/types/behavior";

describe("Behavior & State Machine", () => {
  const createMockContext = (): BehaviorContext => ({
    character: {
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
    },
    personality: {
      energy: 0.8,
      curiosity: 0.9,
      friendliness: 0.8,
      playfulness: 0.7,
      bravery: 0.6,
      laziness: 0.2
    },
    world: new WorldModel(),
    interactions: {
      pointerNear: false,
      pointerOver: false,
      dragged: false,
      scrolling: false,
      lastAction: "none"
    },
    history: new RecentActionLog(),
    energy: 0.8,
    boredom: 0.2,
    novelty: 0.5
  });

  it("transitions between states in StateMachine", () => {
    const sm = new StateMachine();
    const ctx = createMockContext();

    expect(sm.current().name).toBe(ActionState.IDLE);

    sm.transition(ActionState.WALK, ctx, true);
    expect(sm.current().name).toBe(ActionState.WALK);
    expect(ctx.character.action).toBe(ActionState.WALK);
  });

  it("tracks recent actions and applies repetition penalties", () => {
    const log = new RecentActionLog();
    expect(log.penalty("WALK")).toBe(0);

    log.record("WALK");
    expect(log.penalty("WALK")).toBeGreaterThan(0);

    log.record("WALK");
    log.record("WALK");
    expect(log.penalty("WALK")).toBeGreaterThanOrEqual(0.75);
  });

  it("scores actions dynamically via UtilityDecisionEngine", () => {
    const engine = new UtilityDecisionEngine();
    const ctx = createMockContext();

    const decision = engine.choose(ctx);
    expect(decision).toBeDefined();
    expect(decision.score).toBeGreaterThan(0);
    expect(Object.values(ActionState)).toContain(decision.name);
  });

  it("updates drives and handles explicit requests in BehaviorController", () => {
    const controller = new BehaviorController();
    const ctx = createMockContext();

    const ok = controller.requestAction(ActionState.BARK, ctx);
    expect(ok).toBe(true);
    expect(controller.currentState.name).toBe(ActionState.BARK);

    // Update with deltaMs to drain/recover drives
    controller.update(ctx, 100);
    expect(controller.recentHistory.getRecent()).toContain(ActionState.BARK);
  });
});
