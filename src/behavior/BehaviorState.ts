import { ActionState, Direction } from "../types/enums";
import { BehaviorContext } from "../types/behavior";

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
    // Override in concrete state
  }

  exit(context: BehaviorContext): void {
    // Override in concrete state
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
  public maxDurationMs = 3500;

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
  public maxDurationMs = 6000;
  private lastObstacleCheck: number = 0;

  enter(context: BehaviorContext): void {
    super.enter(context);
    
    // Check if there is an attractor zone to head towards
    const attractor = context.world.findNearbyAttractor(context.character.x, context.character.y, 450);
    if (attractor) {
      const attractorX = attractor.bounds.x + attractor.bounds.width / 2;
      context.character.direction = attractorX > context.character.x ? Direction.RIGHT : Direction.LEFT;
    } else if (context.interactions.pointerNear && context.interactions.pointerPosition) {
      context.character.direction =
        context.interactions.pointerPosition.x > context.character.x ? Direction.RIGHT : Direction.LEFT;
    } else if (Math.random() < 0.3) {
      context.character.direction = Math.random() > 0.5 ? Direction.RIGHT : Direction.LEFT;
    }

    const speed = 75 + context.personality.energy * 40;
    context.character.vx = context.character.direction === Direction.RIGHT ? speed : -speed;
  }

  update(context: BehaviorContext, deltaMs: number): void {
    const speed = 75 + context.personality.energy * 40;
    context.character.vx = context.character.direction === Direction.RIGHT ? speed : -speed;

    // 1. Intelligent Lookahead: Check for stairs, obstacles, or gaps ahead
    const now = Date.now();
    if (now - this.lastObstacleCheck > 100 && context.character.grounded) {
      this.lastObstacleCheck = now;

      const obstacle = context.world.findObstacleAhead(
        context.character.x,
        context.character.y,
        context.character.width,
        context.character.height,
        context.character.direction,
        70
      );

      if (obstacle) {
        if (obstacle.type === "step_up" || obstacle.type === "gap") {
          // Smart Stair / Obstacle Jump
          const forwardSpeed = speed * 1.35;
          context.character.vx = context.character.direction === Direction.RIGHT ? forwardSpeed : -forwardSpeed;
          context.character.vy = -Math.max(300, Math.min(460, 240 + obstacle.heightDiff * 2.2));
          context.character.grounded = false;

          // Transition to JUMP state
          (context as any)._jumpedForObstacle = true;
          return;
        } else if (obstacle.type === "wall") {
          // Wall in front, turn around
          context.character.direction =
            context.character.direction === Direction.RIGHT ? Direction.LEFT : Direction.RIGHT;
          context.character.vx = context.character.direction === Direction.RIGHT ? speed : -speed;
        }
      }
    }

    // 2. Turn around when hitting world boundary
    if (context.character.x <= context.world.bounds.minX + 10) {
      context.character.direction = Direction.RIGHT;
    } else if (context.character.x + context.character.width >= context.world.bounds.maxX - 10) {
      context.character.direction = Direction.LEFT;
    }
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
    const speed = 140 + context.personality.energy * 70;
    context.character.vx = context.character.direction === Direction.RIGHT ? speed : -speed;
  }

  update(context: BehaviorContext): void {
    const speed = 140 + context.personality.energy * 70;
    context.character.vx = context.character.direction === Direction.RIGHT ? speed : -speed;

    // Check for obstacles to leap over while running
    if (context.character.grounded) {
      const obstacle = context.world.findObstacleAhead(
        context.character.x,
        context.character.y,
        context.character.width,
        context.character.height,
        context.character.direction,
        90
      );

      if (obstacle && (obstacle.type === "step_up" || obstacle.type === "gap")) {
        context.character.vy = -Math.max(320, Math.min(480, 260 + obstacle.heightDiff * 2.4));
        context.character.grounded = false;
      }
    }
  }

  exit(context: BehaviorContext): void {
    context.character.vx = 0;
  }
}

export class JumpState extends BehaviorState {
  public name = ActionState.JUMP;
  public minDurationMs = 600;
  public maxDurationMs = 1800;

  enter(context: BehaviorContext): void {
    super.enter(context);
    if (context.character.grounded) {
      const forwardSpeed = (80 + context.personality.energy * 50) * (context.character.direction === Direction.RIGHT ? 1 : -1);
      context.character.vx = forwardSpeed;
      context.character.vy = -340 - context.personality.energy * 60;
      context.character.grounded = false;
    }
  }

  update(context: BehaviorContext): void {
    // Keep momentum while in air
  }
}

export class FallState extends BehaviorState {
  public name = ActionState.FALL;
  public minDurationMs = 200;
  public maxDurationMs = 4000;

  enter(context: BehaviorContext): void {
    super.enter(context);
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
  public maxDurationMs = 8000;

  enter(context: BehaviorContext): void {
    super.enter(context);
    context.character.vx = 0;
  }
}

export class ObserveState extends BehaviorState {
  public name = ActionState.OBSERVE;
  public minDurationMs = 1200;
  public maxDurationMs = 2500;

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
