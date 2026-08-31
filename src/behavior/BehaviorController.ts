import { ActionState, Direction } from "../types/enums";
import { BehaviorConfig } from "../types/config";
import { BehaviorAction as IBehaviorAction, BehaviorContext, BrainRequest } from "../types/behavior";
import { StateMachine } from "./StateMachine";
import { LocalBrain } from "./LocalBrain";
import { RemoteBrainClient } from "./RemoteBrainClient";
import { RecentActionLog } from "./RecentActionLog";
import { BehaviorState } from "./BehaviorState";
import { clamp } from "../utils/math";

export class BehaviorController {
  public stateMachine: StateMachine;
  public localBrain: LocalBrain;
  public remoteBrain: RemoteBrainClient | null = null;
  public recentHistory: RecentActionLog;
  public config: BehaviorConfig;
  
  public energy: number = 0.8;
  public boredom: number = 0.1;
  public novelty: number = 0.5;
  public lastDecisionTime: number = 0;
  private pendingRemoteDecision: boolean = false;
  private onActionChangeCallbacks: Set<(action: ActionState) => void> = new Set();

  constructor(config: BehaviorConfig = {}) {
    this.config = config;
    this.stateMachine = new StateMachine();
    this.localBrain = new LocalBrain();
    this.recentHistory = new RecentActionLog();

    if (config.remoteAI && config.remoteAI !== "disabled") {
      this.remoteBrain = new RemoteBrainClient(config.apiEndpoint, config.apiKey);
    }
  }

  get currentState(): BehaviorState {
    return this.stateMachine.current();
  }

  onActionChange(cb: (action: ActionState) => void): () => void {
    this.onActionChangeCallbacks.add(cb);
    return () => this.onActionChangeCallbacks.delete(cb);
  }

  requestAction(actionName: string | ActionState, context: BehaviorContext): boolean {
    const targetState = actionName.toUpperCase() as ActionState;
    if (Object.values(ActionState).includes(targetState)) {
      const success = this.stateMachine.transition(targetState, context, true);
      if (success) {
        this.recentHistory.record(targetState);
        this.notifyActionChange(targetState);
        this.lastDecisionTime = Date.now();
      }
      return success;
    }
    return false;
  }

  update(context: BehaviorContext, deltaMs: number): void {
    const dtSeconds = deltaMs / 1000;
    const current = this.stateMachine.current();

    // 1. Update state logic
    current.update(context, deltaMs);

    // 2. Adjust internal drives (energy, boredom)
    if (current.name === ActionState.SLEEP) {
      this.energy = clamp(this.energy + 0.1 * dtSeconds, 0, 1);
      this.boredom = clamp(this.boredom - 0.05 * dtSeconds, 0, 1);
    } else if (current.name === ActionState.IDLE) {
      this.energy = clamp(this.energy + 0.02 * dtSeconds, 0, 1);
      this.boredom = clamp(this.boredom + 0.08 * dtSeconds, 0, 1);
    } else {
      const energyDrain = current.name === ActionState.RUN ? 0.08 : 0.03;
      this.energy = clamp(this.energy - energyDrain * dtSeconds, 0, 1);
      this.boredom = clamp(this.boredom - 0.1 * dtSeconds, 0, 1);
    }

    // Update context drives
    context.energy = this.energy;
    context.boredom = this.boredom;
    context.novelty = this.novelty;

    // 3. Fall state handling: if character is falling and not in JUMP or CLIMB state, transition to FALL
    if (!context.character.grounded && context.character.vy > 50 && current.name !== ActionState.JUMP && current.name !== ActionState.FALL) {
      this.stateMachine.transition(ActionState.FALL, context, true);
      this.notifyActionChange(ActionState.FALL);
      return;
    }

    // 4. Landed state handling: if character was falling and is now grounded, switch to IDLE
    if (context.character.grounded && current.name === ActionState.FALL) {
      this.stateMachine.transition(ActionState.IDLE, context, true);
      this.notifyActionChange(ActionState.IDLE);
      return;
    }

    // 5. Evaluate if it's time for a new decision
    const now = Date.now();
    const interval = this.config.decisionIntervalMs || 2500;
    const isDue = current.isDue();
    const isExpired = current.isExpired();

    if ((isExpired || (isDue && now - this.lastDecisionTime >= interval)) && !this.pendingRemoteDecision) {
      this.decideNext(context);
    }
  }

  private decideNext(context: BehaviorContext): void {
    this.lastDecisionTime = Date.now();

    // Check if remote AI is enabled
    if (this.remoteBrain && this.config.remoteAI === "required") {
      this.fetchRemoteDecision(context);
      return;
    }

    if (this.remoteBrain && this.config.remoteAI === "optional" && Math.random() < 0.3) {
      this.fetchRemoteDecision(context);
      return;
    }

    // Run local decision
    this.runLocalDecision(context);
  }

  private runLocalDecision(context: BehaviorContext): void {
    const action = this.localBrain.decide(context);
    const targetState = action.name as ActionState;

    if (targetState && targetState !== this.stateMachine.current().name) {
      this.stateMachine.transition(targetState, context);
      this.recentHistory.record(targetState);
      this.notifyActionChange(targetState);
    }
  }

  private async fetchRemoteDecision(context: BehaviorContext): Promise<void> {
    if (!this.remoteBrain) {
      this.runLocalDecision(context);
      return;
    }

    this.pendingRemoteDecision = true;

    const request: BrainRequest = {
      characterId: context.character.id,
      context: {
        currentAction: context.character.action,
        energy: this.energy,
        grounded: context.character.grounded,
        nearbySurfaceCount: context.world.getNearbySurfaces({
          x: context.character.x,
          y: context.character.y,
          width: context.character.width,
          height: context.character.height
        }).length,
        recentActions: this.recentHistory.getRecent(4)
      },
      allowedActions: Object.values(ActionState)
    };

    try {
      const decision = await this.remoteBrain.decide(request, 2000);
      this.pendingRemoteDecision = false;

      if (decision && decision.action) {
        const targetState = decision.action.toUpperCase() as ActionState;
        if (Object.values(ActionState).includes(targetState)) {
          this.stateMachine.transition(targetState, context);
          this.recentHistory.record(targetState);
          this.notifyActionChange(targetState);
          return;
        }
      }

      // Fallback to local brain
      this.runLocalDecision(context);
    } catch {
      this.pendingRemoteDecision = false;
      this.runLocalDecision(context);
    }
  }

  private notifyActionChange(action: ActionState): void {
    for (const cb of this.onActionChangeCallbacks) {
      cb(action);
    }
  }
}
