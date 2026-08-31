import { RuntimeConfig } from "../types/config";
import { RuntimeEvent } from "../types/events";
import { RuntimeState } from "../types/state";
import { WorldModel } from "../world/WorldModel";
import { WorldBuilder } from "../dom/WorldBuilder";
import { DOMScanner } from "../dom/DOMScanner";
import { PhysicsEngine } from "../physics/PhysicsEngine";
import { CameraController } from "../camera/CameraController";
import { InteractionManager } from "../interaction/InteractionManager";
import { CanvasRenderer } from "../renderer/CanvasRenderer";
import { Renderer, RenderFrame } from "../renderer/Renderer";
import { GameLoop } from "./GameLoop";
import { Scheduler } from "./Scheduler";
import { Character } from "./Character";
import { LivingWebAPIClient } from "../api/LivingWebAPIClient";
import { EventEmitter } from "../utils/eventEmitter";

export class LivingRuntime {
  public state: RuntimeState;
  public config: Required<RuntimeConfig>;
  public world: WorldModel;
  public worldBuilder: WorldBuilder;
  public domScanner: DOMScanner;
  public physics: PhysicsEngine;
  public camera: CameraController;
  public interaction: InteractionManager;
  public renderer: Renderer;
  public gameLoop: GameLoop;
  public scheduler: Scheduler;
  public characters: Map<string, Character> = new Map();
  public apiClient: LivingWebAPIClient;
  public events: EventEmitter = new EventEmitter();

  constructor(
    config: RuntimeConfig = {},
    customRenderer?: Renderer,
    customScanner?: DOMScanner
  ) {
    this.config = {
      targetFPS: config.targetFPS ?? 60,
      reducedMotionAware: config.reducedMotionAware ?? true,
      maxCharacters: config.maxCharacters ?? 5,
      debug: config.debug ?? false
    };

    this.state = {
      running: false,
      paused: false,
      deltaTime: 0,
      time: 0,
      viewport: {
        width: typeof window !== "undefined" ? window.innerWidth : 1280,
        height: typeof window !== "undefined" ? window.innerHeight : 800,
        devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        visible: typeof document !== "undefined" ? !document.hidden : true
      },
      camera: { x: 0, y: 0 }
    };

    this.world = new WorldModel();
    this.worldBuilder = new WorldBuilder();
    this.domScanner = customScanner || new DOMScanner();
    this.physics = new PhysicsEngine();
    this.camera = new CameraController();
    this.interaction = new InteractionManager();
    this.renderer = customRenderer || new CanvasRenderer();
    this.gameLoop = new GameLoop(this.config.targetFPS);
    this.scheduler = new Scheduler();
    this.apiClient = new LivingWebAPIClient();

    // Hook up game loop
    this.gameLoop.setFrameCallback((deltaMs, timestamp) => this.tick(deltaMs, timestamp));

    // Handle DOM changes automatically
    this.domScanner.onReconcile((snapshot) => {
      this.world = this.worldBuilder.merge(this.world, snapshot);
      this.events.emit("world:update", { world: this.world });
    });
  }

  addCharacter(character: Character): void {
    if (this.characters.size >= this.config.maxCharacters) {
      return;
    }
    this.characters.set(character.state.id, character);

    // Position character at safe spawn if inside default bounds
    const spawn = this.world.findSafeSpawn(character.state.width, character.state.height);
    character.state.x = spawn.x;
    character.state.y = spawn.y;
    character.state.grounded = true;

    this.events.emit("character:added", { character });
  }

  removeCharacter(id: string): void {
    this.characters.delete(id);
    this.events.emit("character:removed", { id });
  }

  start(container?: HTMLElement | null): void {
    if (this.state.running) return;

    // 1. Initial DOM scan & World construction
    const snapshot = this.domScanner.scan();
    this.world = this.worldBuilder.build(snapshot);

    // Position characters on safe visible surface
    for (const character of this.characters.values()) {
      const spawn = this.world.findSafeSpawn(character.state.width, character.state.height);
      character.state.x = spawn.x;
      character.state.y = spawn.y;
      character.state.grounded = true;
    }

    // 2. Initialize and attach Renderer
    this.renderer.initialize(container);

    // 3. Start DOM observation
    this.domScanner.startObserving();

    // 4. Start Interaction Manager
    this.interaction.start();

    // 5. Start Game Loop
    this.state.running = true;
    this.state.paused = false;
    this.gameLoop.start();

    this.events.emit("runtime:start", {});
  }

  stop(): void {
    this.state.running = false;
    this.gameLoop.stop();
    this.domScanner.stopObserving();
    this.interaction.stop();
    this.events.emit("runtime:stop", {});
  }

  pause(): void {
    this.state.paused = true;
    this.gameLoop.pause();
    this.events.emit("runtime:pause", {});
  }

  resume(): void {
    this.state.paused = false;
    this.gameLoop.resume();
    this.events.emit("runtime:resume", {});
  }

  destroy(): void {
    this.stop();
    this.renderer.destroy();
    this.scheduler.clear();
    this.characters.clear();
    this.events.removeAllListeners();
  }

  dispatch(event: RuntimeEvent): void {
    this.events.emit(event.type, event.payload);
  }

  tick(deltaMs: number, timestamp: number): void {
    this.state.deltaTime = deltaMs;
    this.state.time = timestamp;

    const dtSeconds = deltaMs / 1000;

    // 1. Flush scheduled tasks
    this.scheduler.flushDue(Date.now());

    // 2. Camera scroll sync
    this.camera.syncFromWindow();
    this.state.camera = { ...this.camera.state };

    // 3. Process characters (Physics, Behavior, Animation)
    for (const character of this.characters.values()) {
      // Interaction update for character
      this.interaction.update(character.state, this.camera.state.x, this.camera.state.y);

      // Behavior drive context
      const behaviorContext = {
        character: character.state,
        personality: character.personality,
        world: this.world,
        interactions: this.interaction.getSnapshot(),
        history: character.behavior.recentHistory,
        energy: character.behavior.energy,
        boredom: character.behavior.boredom,
        novelty: character.behavior.novelty
      };

      // Behavior update
      character.behavior.update(behaviorContext, deltaMs);

      // Physics update
      const colResult = this.physics.update(character.state, this.world, dtSeconds);

      // Animation update
      character.animation.update(deltaMs);
    }

    // 4. Render Frame
    const renderCharacters = Array.from(this.characters.values()).map((char) => {
      const currentFrame = char.animation.getCurrentFrame();
      const frameImg = currentFrame ? (char.animation as any).assetManager?.getFrameImageSync(currentFrame) || null : null;

      return {
        id: char.state.id,
        position: { x: char.state.x, y: char.state.y },
        width: char.state.width,
        height: char.state.height,
        animation: char.state.action,
        frameIndex: char.animation.frameIndex,
        direction: char.state.direction,
        opacity: char.state.opacity ?? 1.0,
        frameImage: frameImg,
        speech: char.speech,
        vx: char.state.vx,
        vy: char.state.vy,
        grounded: char.state.grounded
      };
    });

    const frame: RenderFrame = {
      characters: renderCharacters,
      camera: this.state.camera,
      viewport: this.state.viewport,
      debugSurfaces: this.world.surfaces,
      debugMode: this.config.debug
    };

    this.renderer.render(frame);
  }
}
