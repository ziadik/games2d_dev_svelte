import { BaseState } from "./BaseState";
import { Bird } from "../entities/Bird";
import { PipePair } from "../entities/PipePair";
import { playSound } from "../engine/assets";
import { input } from "../engine/input";
import {
  PIPE_HEIGHT,
  PIPE_WIDTH,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
} from "../engine/constants";
import type { RenderContext } from "../engine/types";

export interface PlayStateCallbacks {
  onChangeToScore: (score: number) => void;
}

export class PlayState extends BaseState {
  bird: Bird;
  pipePairs: PipePair[] = [];
  timer = 0;
  score = 0;
  lastY: number;

  constructor(private cb: PlayStateCallbacks) {
    super();
    this.bird = new Bird();
    this.lastY = -PIPE_HEIGHT + Math.random() * 80 + 20;
  }

  enter() {
    // сбрасываем состояние при входе
    this.bird = new Bird();
    this.pipePairs = [];
    this.timer = 0;
    this.score = 0;
    this.lastY = -PIPE_HEIGHT + Math.random() * 80 + 20;
  }

  exit() {}

  update(dt: number) {
    this.timer += dt;

    if (this.timer > 2) {
      const y = Math.max(
        -PIPE_HEIGHT + 10,
        Math.min(
          this.lastY + (Math.random() * 40 - 20),
          VIRTUAL_HEIGHT - 90 - PIPE_HEIGHT,
        ),
      );
      this.lastY = y;
      this.pipePairs.push(new PipePair(y));
      this.timer = 0;
    }

    for (const pair of this.pipePairs) {
      if (!pair.scored && pair.x + PIPE_WIDTH < this.bird.x) {
        this.score += 1;
        pair.scored = true;
        playSound("score");
      }
      pair.update(dt);
    }

    this.pipePairs = this.pipePairs.filter((p) => !p.remove);

    for (const pair of this.pipePairs) {
      for (const pipe of [pair.pipes.upper, pair.pipes.lower]) {
        if (this.bird.collides(pipe)) {
          playSound("explosion");
          playSound("hurt");
          this.cb.onChangeToScore(this.score);
          return;
        }
      }
    }

    this.bird.update(dt);

    if (this.bird.y > VIRTUAL_HEIGHT - 15) {
      playSound("explosion");
      playSound("hurt");
      this.cb.onChangeToScore(this.score);
    }
  }

  render(rc: RenderContext) {
    for (const pair of this.pipePairs) {
      pair.render(rc);
    }

    const ctx = rc.ctx;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = '28px "flappy"';
    ctx.fillText(`Score: ${this.score}`, 8, 40);
    ctx.restore();

    this.bird.render(rc);
  }
}
