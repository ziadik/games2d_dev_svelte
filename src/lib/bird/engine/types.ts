export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IState {
  enter?(params?: any): void;
  exit?(): void;
  update(dt: number): void;
  render(rc: RenderContext): void;
  processAI?(params: any, dt: number): void;
}
