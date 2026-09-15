import type { IState, RenderContext } from "./types";
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from "./constants";

const emptyState: IState = {
  update: () => {},
  render: () => {},
  enter: () => {},
  exit: () => {},
  processAI: () => {},
};

export class StateMachine {
  private states: Record<string, () => IState> = {};
  private current: IState = emptyState;
  readonly empty = emptyState;

  constructor(states: Record<string, () => IState>) {
    this.states = states;
    this.current = emptyState;
  }

  change(stateName: string, enterParams?: any) {
    if (!this.states[stateName]) {
      throw new Error(`State "${stateName}" does not exist`);
    }
    this.current.exit?.();
    this.current = this.states[stateName]();
    this.current.enter?.(enterParams);
  }

  update(dt: number) {
    this.current.update(dt);
  }

  render(rc: RenderContext) {
    this.current.render(rc);
  }

  processAI(params: any, dt: number) {
    this.current.processAI?.(params, dt);
  }

  getCurrent() {
    return this.current;
  }
}

export const VIRTUAL = { width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT };
