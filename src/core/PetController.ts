import { ActionState, Direction } from "../types/enums";
import { CharacterState } from "../types/state";
import { Character } from "./Character";
import { LivingRuntime } from "./LivingRuntime";

export class PetController {
  private runtime: LivingRuntime;
  private character: Character;

  constructor(runtime: LivingRuntime, character: Character) {
    this.runtime = runtime;
    this.character = character;
  }

  start(container?: HTMLElement | null): this {
    this.runtime.start(container);
    return this;
  }

  stop(): this {
    this.runtime.stop();
    return this;
  }

  pause(): this {
    this.runtime.pause();
    return this;
  }

  resume(): this {
    this.runtime.resume();
    return this;
  }

  destroy(): void {
    this.runtime.removeCharacter(this.character.state.id);
    this.runtime.destroy();
  }

  do(action: string | ActionState): boolean {
    const context = {
      character: this.character.state,
      personality: this.character.personality,
      world: this.runtime.world,
      interactions: this.runtime.interaction.getSnapshot(),
      history: this.character.behavior.recentHistory,
      energy: this.character.behavior.energy,
      boredom: this.character.behavior.boredom,
      novelty: this.character.behavior.novelty
    };

    return this.character.do(action, context);
  }

  say(text: string, durationMs: number = 3000): this {
    this.character.say(text, durationMs);
    this.runtime.events.emit("speech", {
      characterId: this.character.state.id,
      text,
      durationMs
    });
    return this;
  }

  jump(): boolean {
    return this.do(ActionState.JUMP);
  }

  bark(): boolean {
    return this.do(ActionState.BARK);
  }

  sleep(): boolean {
    return this.do(ActionState.SLEEP);
  }

  walk(): boolean {
    return this.do(ActionState.WALK);
  }

  run(): boolean {
    return this.do(ActionState.RUN);
  }

  setDirection(direction: Direction): this {
    this.character.state.direction = direction;
    this.character.animation.setDirection(direction);
    return this;
  }

  teleport(x: number, y: number): this {
    this.character.state.x = x;
    this.character.state.y = y;
    this.character.state.vx = 0;
    this.character.state.vy = 0;
    return this;
  }

  getState(): CharacterState {
    return { ...this.character.state };
  }

  getCharacter(): Character {
    return this.character;
  }

  getRuntime(): LivingRuntime {
    return this.runtime;
  }

  on(event: string, handler: (data: any) => void): () => void {
    return this.runtime.events.on(event, handler);
  }

  off(event: string, handler: (data: any) => void): void {
    this.runtime.events.off(event, handler);
  }
}
