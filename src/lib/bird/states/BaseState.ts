import type { IState, RenderContext } from "../engine/types";

export class BaseState implements IState {
  init?(): void;
  enter(_params?: any): void {}
  exit(): void {}
  update(_dt: number): void {}
  render(_rc: RenderContext): void {}
  processAI?(_params: any, _dt: number): void;
}
