import { CharacterState, Personality } from "../types/state";
import { ActionState, Direction } from "../types/enums";
import { AnimationController } from "../animation/AnimationController";
import { BehaviorController } from "../behavior/BehaviorController";
import { AssetManager } from "../assets/AssetManager";
import { BehaviorConfig, PersonalityConfig } from "../types/config";
import { SpeechBubbleState } from "../renderer/Renderer";
import { BehaviorContext } from "../types/behavior";

export class Character {
  public state: CharacterState;
  public personality: Personality;
  public animation: AnimationController;
  public behavior: BehaviorController;
  public speech?: SpeechBubbleState;

  constructor(
    id: string,
    name: string,
    species: string,
    assetManager: AssetManager,
    personalityConfig: PersonalityConfig = {},
    behaviorConfig: BehaviorConfig = {}
  ) {
    this.personality = {
      energy: personalityConfig.energy ?? 0.7,
      curiosity: personalityConfig.curiosity ?? 0.8,
      friendliness: personalityConfig.friendliness ?? 0.9,
      playfulness: personalityConfig.playfulness ?? 0.7,
      bravery: personalityConfig.bravery ?? 0.6,
      laziness: personalityConfig.laziness ?? 0.3
    };

    this.state = {
      id,
      name,
      species,
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      width: 48,
      height: 48,
      grounded: true,
      direction: Direction.RIGHT,
      action: ActionState.IDLE,
      opacity: 1.0
    };

    this.animation = new AnimationController(assetManager);
    this.behavior = new BehaviorController(behaviorConfig);

    // Sync behavior action changes with animation controller
    this.behavior.onActionChange((action: ActionState) => {
      this.state.action = action;
      this.animation.play(action.toLowerCase());
    });
  }

  say(text: string, durationMs: number = 3000): void {
    this.speech = {
      text,
      expiresAt: Date.now() + durationMs
    };
  }

  do(action: string, context?: BehaviorContext): boolean {
    if (context) {
      return this.behavior.requestAction(action, context);
    }
    return false;
  }
}
