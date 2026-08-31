import { ActionState } from "../types/enums";
import { BehaviorContext } from "../types/behavior";
import {
  BarkState,
  BehaviorState,
  ClimbState,
  FallState,
  IdleState,
  InteractState,
  JumpState,
  ObserveState,
  RunState,
  SleepState,
  WalkState
} from "./BehaviorState";

export class StateMachine {
  private states: Map<string, BehaviorState> = new Map();
  private currentState: BehaviorState;

  constructor() {
    // Register all default states
    this.register(new IdleState());
    this.register(new WalkState());
    this.register(new RunState());
    this.register(new JumpState());
    this.register(new FallState());
    this.register(new ClimbState());
    this.register(new BarkState());
    this.register(new SleepState());
    this.register(new ObserveState());
    this.register(new InteractState());

    this.currentState = this.states.get(ActionState.IDLE)!;
  }

  register(state: BehaviorState): void {
    this.states.set(state.name, state);
  }

  getState(name: string): BehaviorState | undefined {
    return this.states.get(name);
  }

  transition(toName: string, context: BehaviorContext, force: boolean = false): boolean {
    const nextState = this.states.get(toName);
    if (!nextState) {
      return false;
    }

    if (!force && !this.currentState.isDue() && this.currentState.name === nextState.name) {
      return false;
    }

    this.currentState.exit(context);
    this.currentState = nextState;
    this.currentState.enter(context);
    return true;
  }

  current(): BehaviorState {
    return this.currentState;
  }
}
