import { ActionState } from "../types/enums";
import { BehaviorAction, BehaviorContext } from "../types/behavior";
import { clamp } from "../utils/math";

export class UtilityDecisionEngine {
  private candidateActions: ActionState[] = [
    ActionState.IDLE,
    ActionState.WALK,
    ActionState.RUN,
    ActionState.JUMP,
    ActionState.BARK,
    ActionState.OBSERVE,
    ActionState.SLEEP,
    ActionState.INTERACT
  ];

  score(context: BehaviorContext, actionName: ActionState): number {
    const { personality, character, interactions, history, energy, boredom, novelty } = context;
    let baseScore = 0.5;

    // Repetition penalty
    const penalty = history.penalty(actionName);
    baseScore -= penalty * 0.4;

    switch (actionName) {
      case ActionState.IDLE:
        baseScore += (personality.laziness ?? 0.3) * 0.5 + (1 - energy) * 0.4 - boredom * 0.3;
        break;

      case ActionState.WALK:
        baseScore += personality.curiosity * 0.4 + personality.energy * 0.3 + boredom * 0.4;
        break;

      case ActionState.RUN:
        baseScore += personality.energy * 0.6 + (personality.playfulness ?? 0.5) * 0.3 - (1 - energy) * 0.5;
        break;

      case ActionState.JUMP:
        if (!character.grounded) {
          return 0; // cannot jump if in air
        }
        baseScore += (personality.playfulness ?? 0.5) * 0.4 + (personality.bravery ?? 0.5) * 0.3 + novelty * 0.2;
        break;

      case ActionState.BARK:
        baseScore += (personality.playfulness ?? 0.5) * 0.3 + personality.friendliness * 0.4;
        if (interactions.pointerNear || interactions.pointerOver) {
          baseScore += 0.4;
        }
        break;

      case ActionState.OBSERVE:
        baseScore += personality.curiosity * 0.5 + (personality.laziness ?? 0.3) * 0.3;
        break;

      case ActionState.SLEEP:
        baseScore += (personality.laziness ?? 0.3) * 0.6 + (1 - energy) * 0.6 - boredom * 0.2;
        if (energy > 0.6) baseScore -= 0.5;
        break;

      case ActionState.INTERACT:
        baseScore += personality.friendliness * 0.5 + (personality.playfulness ?? 0.5) * 0.3;
        if (interactions.pointerNear || interactions.pointerOver) {
          baseScore += 0.6;
        }
        break;
    }

    // Add small random noise to prevent rigid deterministic loops
    const noise = (Math.random() - 0.5) * 0.15;
    return clamp(baseScore + noise, 0, 2);
  }

  choose(context: BehaviorContext): BehaviorAction {
    let bestAction: ActionState = ActionState.IDLE;
    let highestScore = -Infinity;

    for (const candidate of this.candidateActions) {
      const score = this.score(context, candidate);
      if (score > highestScore) {
        highestScore = score;
        bestAction = candidate;
      }
    }

    const durationMs = this.getEstimatedDuration(bestAction);

    return {
      name: bestAction,
      score: highestScore,
      durationMs
    };
  }

  private getEstimatedDuration(action: ActionState): number {
    switch (action) {
      case ActionState.IDLE:
        return 2000 + Math.random() * 2000;
      case ActionState.WALK:
        return 2500 + Math.random() * 2500;
      case ActionState.RUN:
        return 1800 + Math.random() * 1500;
      case ActionState.JUMP:
        return 800;
      case ActionState.BARK:
        return 1200;
      case ActionState.SLEEP:
        return 5000 + Math.random() * 4000;
      case ActionState.OBSERVE:
        return 2000;
      case ActionState.INTERACT:
        return 1500;
      default:
        return 2000;
    }
  }
}
