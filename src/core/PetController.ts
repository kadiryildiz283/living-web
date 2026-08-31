import { ActionState, Direction } from "../types/enums";
import { CharacterState } from "../types/state";
import { CharacterSkill, CharacterSkillContext } from "../types/behavior";
import { Character } from "./Character";
import { LivingRuntime } from "./LivingRuntime";

export class PetController {
  private runtime: LivingRuntime;
  private character: Character;
  private skills: Map<string, CharacterSkill> = new Map();
  private skillCooldowns: Map<string, number> = new Map();

  constructor(runtime: LivingRuntime, character: Character, initialSkills: CharacterSkill[] = []) {
    this.runtime = runtime;
    this.character = character;

    for (const skill of initialSkills) {
      this.registerSkill(skill);
    }
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

  /**
   * Register a custom skill for this character
   */
  registerSkill(skill: CharacterSkill): this {
    this.skills.set(skill.name, skill);
    return this;
  }

  /**
   * Execute a custom skill by name
   */
  async useSkill(name: string, ...args: any[]): Promise<boolean> {
    const skill = this.skills.get(name);
    if (!skill) {
      console.warn(`Skill "${name}" not registered on character ${this.character.state.name}`);
      return false;
    }

    const now = Date.now();
    const lastUsed = this.skillCooldowns.get(name) || 0;
    const cooldown = skill.cooldownMs || 0;

    if (now - lastUsed < cooldown) {
      console.warn(`Skill "${name}" is on cooldown (${Math.ceil((cooldown - (now - lastUsed)) / 1000)}s remaining)`);
      return false;
    }

    this.skillCooldowns.set(name, now);

    const context: CharacterSkillContext = {
      character: this.character.state,
      world: this.runtime.world,
      say: (t, d) => this.say(t, d),
      teleport: (x, y) => this.teleport(x, y),
      jump: () => this.jump(),
      bark: () => this.bark(),
      walk: () => this.walk(),
      sleep: () => this.sleep(),
      do: (a) => this.do(a)
    };

    try {
      await skill.execute(context, ...args);
      this.runtime.events.emit("skill:executed", {
        characterId: this.character.state.id,
        skillName: name
      });
      return true;
    } catch (err) {
      console.error(`Error executing skill "${name}":`, err);
      return false;
    }
  }

  getSkills(): CharacterSkill[] {
    return Array.from(this.skills.values());
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
