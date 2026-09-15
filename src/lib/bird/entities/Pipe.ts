import { getAssets } from "../engine/assets";
import { PIPE_HEIGHT, PIPE_WIDTH, VIRTUAL_WIDTH } from "../engine/constants";
import type { RenderContext } from "../engine/types";

export type PipeOrientation = "top" | "bottom";

export class Pipe {
  x: number;
  y: number;
  width = PIPE_WIDTH;
  height = PIPE_HEIGHT;
  orientation: PipeOrientation;

  constructor(orientation: PipeOrientation, y: number) {
    this.x = VIRTUAL_WIDTH + 64;
    this.y = y;
    this.orientation = orientation;
  }

  update(_dt: number) {}

  render(rc: RenderContext) {
    const img = getAssets().textures.pipe;
    const ctx = rc.ctx;

    ctx.save();
    if (this.orientation === "top") {
      // отрисовка сверху вниз с отражением по Y
      ctx.translate(this.x, this.y + PIPE_HEIGHT);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0);
    } else {
      ctx.drawImage(img, this.x, this.y);
    }
    ctx.restore();
  }
}
