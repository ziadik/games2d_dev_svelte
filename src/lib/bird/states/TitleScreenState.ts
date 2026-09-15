import { BaseState } from "./BaseState";
import { input } from "../engine/input";
import { VIRTUAL_WIDTH } from "../engine/constants";
import type { RenderContext } from "../engine/types";

export class TitleScreenState extends BaseState {
  constructor(private onEnter: () => void) {
    super();
  }

  update(_dt: number) {
    if (input.wasKeyPressed("Enter")) {
      this.onEnter();
    }
  }

  render(rc: RenderContext) {
    const ctx = rc.ctx;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = '28px "flappy"';
    ctx.textAlign = "center";
    ctx.fillText("Fifty Bird", VIRTUAL_WIDTH / 2, 96);

    ctx.font = '14px "flappy"';
    ctx.fillText("Press Enter", VIRTUAL_WIDTH / 2, 140);
    ctx.restore();
  }
}
