import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from "./constants";
import type { Paddle, Ball } from "./types";

export function createPlayer1(): Paddle {
  return { x: 10, y: 30, width: 5, height: 20, dy: 0 };
}

export function createPlayer2(): Paddle {
  return {
    x: VIRTUAL_WIDTH - 10,
    y: VIRTUAL_HEIGHT - 30,
    width: 5,
    height: 20,
    dy: 0,
  };
}

export function createBall(): Ball {
  return {
    x: VIRTUAL_WIDTH / 2 - 2,
    y: VIRTUAL_HEIGHT / 2 - 2,
    width: 4,
    height: 4,
    dx: 0,
    dy: 0,
  };
}

export function resetBall(ball: Ball): void {
  ball.x = VIRTUAL_WIDTH / 2 - 2;
  ball.y = VIRTUAL_HEIGHT / 2 - 2;
  ball.dx = 0;
  ball.dy = 0;
}
