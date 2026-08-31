import { BehaviorAction, BehaviorContext } from "../types/behavior";
import { UtilityDecisionEngine } from "./UtilityDecisionEngine";

export class LocalBrain {
  private engine: UtilityDecisionEngine;

  constructor(engine: UtilityDecisionEngine = new UtilityDecisionEngine()) {
    this.engine = engine;
  }

  decide(context: BehaviorContext): BehaviorAction {
    return this.engine.choose(context);
  }
}
