import { BaseState } from "./BaseState";
import { COUNTDOWN_TIME, VIRTUAL_WIDTH } from "../engine/constants";
import type { RenderContext } from "../engine/types";

export class CountdownState extends BaseState {
  count = 3;
  timer = 0;

  constructor(private onComplete: () => void) {
    super();
  }

  update(dt: number) {
    this.timer += dt;
    if (this.timer > COUNTDOWN_TIME) {
      this.timer = this.timer % COUNTDOWN_TIME;
      this.count -= 1;
      if (this.count === 0) {
        this.onComplete();
      }
    }
  }

  render(rc: RenderContext) {
    const ctx = rc.ctx;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = '56px "flappy"';
    ctx.textAlign = "center";
    ctx.fillText(String(this.count), VIRTUAL_WIDTH / 2, 160);
    ctx.restore();
  }
}
