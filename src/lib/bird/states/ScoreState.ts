import { BaseState } from "./BaseState";
import { input } from "../engine/input";
import { VIRTUAL_WIDTH } from "../engine/constants";
import type { RenderContext } from "../engine/types";

export class ScoreState extends BaseState {
  score = 0;

  constructor(private onRestart: () => void) {
    super();
  }

  enter(params: { score: number }) {
    this.score = params.score;
  }

  update(_dt: number) {
    if (input.wasKeyPressed("Enter")) {
      this.onRestart();
    }
  }

  render(rc: RenderContext) {
    const ctx = rc.ctx;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";

    ctx.font = '28px "flappy"';
    ctx.fillText("Oof! You lost!", VIRTUAL_WIDTH / 2, 100);

    ctx.font = '14px "flappy"';
    ctx.fillText(`Score: ${this.score}`, VIRTUAL_WIDTH / 2, 136);
    ctx.fillText("Press Enter to Play Again!", VIRTUAL_WIDTH / 2, 196);

    ctx.restore();
  }
}
