import { PetConfig, RuntimeConfig } from "../types/config";
import { AssetManager } from "../assets/AssetManager";
import { CanvasRenderer } from "../renderer/CanvasRenderer";
import { Character } from "./Character";
import { LivingRuntime } from "./LivingRuntime";
import { PetController } from "./PetController";

export class LivingWebSDK {
  public static readonly version: string = "1.0.0";

  /**
   * Main developer-friendly factory function to instantiate a living character
   */
  public static async livingPet(config: PetConfig): Promise<PetController> {
    const assetManager = new AssetManager();
    if (config.assets) {
      await assetManager.load(config.assets);
      // Preload default animations in background
      assetManager.preloadAll().catch(() => {});
    }

    const renderer = config.customCanvas ? new CanvasRenderer(config.customCanvas) : undefined;
    const runtime = new LivingRuntime(
      {
        targetFPS: 60,
        reducedMotionAware: true,
        maxCharacters: 5
      },
      renderer
    );

    const charId = `pet-${Date.now()}`;
    const charName = config.name || "Boncuk";
    const species = config.species || "dog";

    const character = new Character(
      charId,
      charName,
      species,
      assetManager,
      config.personality,
      config.behavior
    );

    if (config.physics) {
      Object.assign(runtime.physics.config, config.physics);
    }

    runtime.addCharacter(character);

    return new PetController(runtime, character, config.skills);
  }

  /**
   * Synchronous pet factory for instant initialization
   */
  public static createPet(config: PetConfig): PetController {
    const assetManager = new AssetManager();
    if (config.assets) {
      assetManager.load(config.assets).catch(() => {});
    }

    const renderer = config.customCanvas ? new CanvasRenderer(config.customCanvas) : undefined;
    const runtime = new LivingRuntime(
      {
        targetFPS: 60,
        reducedMotionAware: true,
        maxCharacters: 5
      },
      renderer
    );

    const charId = `pet-${Date.now()}`;
    const charName = config.name || "Boncuk";
    const species = config.species || "dog";

    const character = new Character(
      charId,
      charName,
      species,
      assetManager,
      config.personality,
      config.behavior
    );

    if (config.physics) {
      Object.assign(runtime.physics.config, config.physics);
    }

    runtime.addCharacter(character);

    return new PetController(runtime, character, config.skills);
  }

  /**
   * Creates a standalone LivingRuntime instance
   */
  public static createRuntime(config?: RuntimeConfig): LivingRuntime {
    return new LivingRuntime(config);
  }
}

/**
 * Top-level quick exports
 */
export const livingPet = LivingWebSDK.livingPet;
export const createPet = LivingWebSDK.createPet;
export const createRuntime = LivingWebSDK.createRuntime;
export const version = LivingWebSDK.version;
