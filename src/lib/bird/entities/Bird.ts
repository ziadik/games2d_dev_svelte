import { getAssets, playSound } from "../engine/assets";
import { input } from "../engine/input";
import {
  BIRD_GRAVITY,
  PIPE_WIDTH,
  PIPE_HEIGHT,
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
} from "../engine/constants";
import type { RenderContext, Rect } from "../engine/types";

export class Bird {
  x: number;
  y: number;
  width: number;
  height: number;
  dy = 0;

  constructor() {
    const img = getAssets().textures.bird;
    this.x = VIRTUAL_WIDTH / 2 - 8;
    this.y = VIRTUAL_HEIGHT / 2 - 8;
    this.width = img.width;
    this.height = img.height;
  }

  collides(pipe: Rect & { x: number; y: number }): boolean {
    if (
      this.x + 2 + (this.width - 4) >= pipe.x &&
      this.x + 2 <= pipe.x + PIPE_WIDTH
    ) {
      if (
        this.y + 2 + (this.height - 4) >= pipe.y &&
        this.y + 2 <= pipe.y + PIPE_HEIGHT
      ) {
        return true;
      }
    }
    return false;
  }

  update(dt: number) {
    this.dy = this.dy + BIRD_GRAVITY * dt;

    if (input.wasKeyPressed(" ") || input.wasMousePressed(0)) {
      this.dy = -300;
      playSound("jump");
    }

    this.y = this.y + this.dy * dt;
  }

  render(rc: RenderContext) {
    rc.ctx.drawImage(getAssets().textures.bird, this.x, this.y);
  }
}
