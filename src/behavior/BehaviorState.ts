import { ActionState, Direction } from "../types/enums";
import { BehaviorAction, BehaviorContext } from "../types/behavior";

export abstract class BehaviorState {
  public abstract name: ActionState;
  public allowedActions: ActionState[] = [];
  public minDurationMs: number = 500;
  public maxDurationMs: number = 3000;
  public stateStartTime: number = 0;

  enter(context: BehaviorContext): void {
    this.stateStartTime = Date.now();
    context.character.action = this.name;
  }

  update(context: BehaviorContext, deltaMs: number): void {
    // Override in concrete state if needed
  }

  exit(context: BehaviorContext): void {
    // Override in concrete state if needed
  }

  getElapsed(): number {
    return Date.now() - this.stateStartTime;
  }

  isDue(): boolean {
    return this.getElapsed() >= this.minDurationMs;
  }

  isExpired(): boolean {
    return this.getElapsed() >= this.maxDurationMs;
  }
}

export class IdleState extends BehaviorState {
  public name = ActionState.IDLE;
  public minDurationMs = 1000;
  public maxDurationMs = 4000;

  enter(context: BehaviorContext): void {
    super.enter(context);
    context.character.vx = 0;
  }

  update(context: BehaviorContext): void {
    context.character.vx = 0;
  }
}

export class WalkState extends BehaviorState {
  public name = ActionState.WALK;
  public minDurationMs = 1500;
  public maxDurationMs = 5000;
  private walkDirection: Direction = Direction.RIGHT;

  enter(context: BehaviorContext): void {
    super.enter(context);
    // Pick direction randomly or towards interesting surface/pointer
    if (context.interactions.pointerNear && context.interactions.pointerPosition) {
      this.walkDirection =
        context.interactions.pointerPosition.x > context.character.x ? Direction.RIGHT : Direction.LEFT;
    } else {
      this.walkDirection = Math.random() > 0.5 ? Direction.RIGHT : Direction.LEFT;
    }

    context.character.direction = this.walkDirection;
    const speed = 70 + context.personality.energy * 40;
    context.character.vx = this.walkDirection === Direction.RIGHT ? speed : -speed;
  }

  update(context: BehaviorContext): void {
    const speed = 70 + context.personality.energy * 40;
    context.character.vx = context.character.direction === Direction.RIGHT ? speed : -speed;
  }

  exit(context: BehaviorContext): void {
    context.character.vx = 0;
  }
}

export class RunState extends BehaviorState {
  public name = ActionState.RUN;
  public minDurationMs = 1200;
  public maxDurationMs = 3500;

  enter(context: BehaviorContext): void {
    super.enter(context);
    const speed = 140 + context.personality.energy * 80;
    context.character.vx = context.character.direction === Direction.RIGHT ? speed : -speed;
  }

  update(context: BehaviorContext): void {
    const speed = 140 + context.personality.energy * 80;
    context.character.vx = context.character.direction === Direction.RIGHT ? speed : -speed;
  }

  exit(context: BehaviorContext): void {
    context.character.vx = 0;
  }
}

export class JumpState extends BehaviorState {
  public name = ActionState.JUMP;
  public minDurationMs = 600;
  public maxDurationMs = 1500;

  enter(context: BehaviorContext): void {
    super.enter(context);
    if (context.character.grounded) {
      context.character.vy = -300 - context.personality.energy * 80;
      context.character.grounded = false;
    }
  }

  update(context: BehaviorContext): void {
    // In air
  }
}

export class FallState extends BehaviorState {
  public name = ActionState.FALL;
  public minDurationMs = 200;
  public maxDurationMs = 4000;

  enter(context: BehaviorContext): void {
    super.enter(context);
  }

  update(context: BehaviorContext): void {
    // Falling
  }
}

export class ClimbState extends BehaviorState {
  public name = ActionState.CLIMB;
  public minDurationMs = 800;
  public maxDurationMs = 2500;

  enter(context: BehaviorContext): void {
    super.enter(context);
    context.character.vy = -120;
    context.character.grounded = false;
  }

  update(context: BehaviorContext): void {
    context.character.vy = -80;
  }

  exit(context: BehaviorContext): void {
    context.character.vy = 0;
  }
}

export class BarkState extends BehaviorState {
  public name = ActionState.BARK;
  public minDurationMs = 800;
  public maxDurationMs = 1600;

  enter(context: BehaviorContext): void {
    super.enter(context);
    context.character.vx = 0;
  }
}

export class SleepState extends BehaviorState {
  public name = ActionState.SLEEP;
  public minDurationMs = 3000;
  public maxDurationMs = 10000;

  enter(context: BehaviorContext): void {
    super.enter(context);
    context.character.vx = 0;
  }
}

export class ObserveState extends BehaviorState {
  public name = ActionState.OBSERVE;
  public minDurationMs = 1200;
  public maxDurationMs = 3000;

  enter(context: BehaviorContext): void {
    super.enter(context);
    context.character.vx = 0;
  }
}

export class InteractState extends BehaviorState {
  public name = ActionState.INTERACT;
  public minDurationMs = 1000;
  public maxDurationMs = 2500;

  enter(context: BehaviorContext): void {
    super.enter(context);
  }
}
