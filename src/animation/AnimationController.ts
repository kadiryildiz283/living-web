import { AnimationDefinition } from "../types/animation";
import { Direction } from "../types/enums";
import { AssetManager } from "../assets/AssetManager";

export class AnimationController {
  private assetManager: AssetManager;
  public current: string = "idle";
  public currentDefinition: AnimationDefinition | null = null;
  public frameIndex: number = 0;
  public elapsed: number = 0;
  public direction: Direction = Direction.RIGHT;
  public isPlaying: boolean = true;
  private onFinishedCallback?: () => void;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  play(name: string, onFinished?: () => void): void {
    if (this.current === name && this.currentDefinition) {
      this.isPlaying = true;
      if (onFinished) this.onFinishedCallback = onFinished;
      return;
    }

    const definition = this.assetManager.resolveAnimation(name);
    if (!definition) {
      return;
    }

    this.current = name;
    this.currentDefinition = definition;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.isPlaying = true;
    this.onFinishedCallback = onFinished;
  }

  stop(): void {
    this.isPlaying = false;
  }

  setDirection(direction: Direction): void {
    this.direction = direction;
  }

  update(deltaMs: number): void {
    if (!this.isPlaying || !this.currentDefinition || this.currentDefinition.frames.length === 0) {
      return;
    }

    const frames = this.currentDefinition.frames;
    const frameDuration = this.currentDefinition.frameDurationMs || 100;

    this.elapsed += deltaMs;

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      if (this.frameIndex + 1 < frames.length) {
        this.frameIndex++;
        if (this.frameIndex === frames.length - 1 && !this.currentDefinition.loop) {
          if (this.onFinishedCallback) {
            const cb = this.onFinishedCallback;
            this.onFinishedCallback = undefined;
            cb();
          }
        }
      } else {
        if (this.currentDefinition.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = frames.length - 1;
          if (this.onFinishedCallback) {
            const cb = this.onFinishedCallback;
            this.onFinishedCallback = undefined;
            cb();
          }
          break;
        }
      }
    }
  }

  getCurrentFrame(): string | CanvasImageSource | null {
    if (!this.currentDefinition || this.currentDefinition.frames.length === 0) {
      // Try resolving current animation or idle
      this.currentDefinition = this.assetManager.resolveAnimation(this.current) || null;
      if (!this.currentDefinition || this.currentDefinition.frames.length === 0) {
        return null;
      }
    }

    const safeIndex = Math.min(this.frameIndex, this.currentDefinition.frames.length - 1);
    return this.currentDefinition.frames[safeIndex];
  }

  isFinished(): boolean {
    if (!this.currentDefinition) return true;
    if (this.currentDefinition.loop) return false;
    return this.frameIndex >= this.currentDefinition.frames.length - 1;
  }
}
