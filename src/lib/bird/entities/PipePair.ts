import { Pipe } from "./Pipe";
import { getAssets } from "../engine/assets";
import {
  PIPE_HEIGHT,
  PIPE_SPEED,
  PIPE_WIDTH,
  PIPE_GAP_HEIGHT,
  VIRTUAL_WIDTH,
} from "../engine/constants";
import type { RenderContext } from "../engine/types";

export class PipePair {
  x: number;
  y: number;
  scored = false;
  remove = false;
  pipes: { upper: Pipe; lower: Pipe };

  constructor(y: number) {
    this.x = VIRTUAL_WIDTH + 32;
    this.y = y;

    this.pipes = {
      upper: new Pipe("top", this.y),
      lower: new Pipe("bottom", this.y + PIPE_HEIGHT + PIPE_GAP_HEIGHT),
    };
  }

  update(dt: number) {
    if (this.x > -PIPE_WIDTH) {
      this.x = this.x - PIPE_SPEED * dt;
      this.pipes.lower.x = this.x;
      this.pipes.upper.x = this.x;
    } else {
      this.remove = true;
    }
  }

  render(rc: RenderContext) {
    this.pipes.upper.render(rc);
    this.pipes.lower.render(rc);
  }
}
