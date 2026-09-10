import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, PADDLE_SPEED } from "./constants";
import type { Paddle, Ball, Rect } from "./types";

export function collides(a: Rect, b: Rect): boolean {
  if (a.x >= b.x + b.width || b.x >= a.x + a.width) return false;
  if (a.y >= b.y + b.height || b.y >= a.y + a.height) return false;
  return true;
}

/** Возвращает 'top' | 'bottom' если мяч отскочил от стены, иначе null. */
export function bounceWalls(ball: Ball): "top" | "bottom" | null {
  if (ball.y <= 0) {
    ball.y = 0;
    ball.dy = -ball.dy;
    return "top";
  }
  if (ball.y >= VIRTUAL_HEIGHT - ball.height) {
    ball.y = VIRTUAL_HEIGHT - ball.height;
    ball.dy = -ball.dy;
    return "bottom";
  }
  return null;
}

/** Отскок от ракетки. side определяет, куда выталкивать мяч. */
export function bouncePaddle(
  ball: Ball,
  paddle: Paddle,
  side: "left" | "right",
): void {
  ball.dx = -ball.dx * 1.03;
  ball.x = side === "left" ? paddle.x + paddle.width : paddle.x - ball.width;
  ball.dy =
    ball.dy < 0 ? -(Math.random() * 140 + 10) : Math.random() * 140 + 10;
}

/** Обновляет позицию ракетки с учётом границ экрана. */
export function movePaddle(paddle: Paddle, dt: number): void {
  if (paddle.dy < 0) {
    paddle.y = Math.max(0, paddle.y + paddle.dy * dt);
  } else {
    paddle.y = Math.min(
      VIRTUAL_HEIGHT - paddle.height,
      paddle.y + paddle.dy * dt,
    );
  }
}

/** Плавно двигает мяч. */
export function stepBall(ball: Ball, dt: number): void {
  ball.x += ball.dx * dt;
  ball.y += ball.dy * dt;
}

/** Применяет ввод клавиатуры к скорости ракетки. */
export function applyInput(
  paddle: Paddle,
  upPressed: boolean,
  downPressed: boolean,
): void {
  if (upPressed) paddle.dy = -PADDLE_SPEED;
  else if (downPressed) paddle.dy = PADDLE_SPEED;
  else paddle.dy = 0;
}
