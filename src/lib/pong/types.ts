export type GameState = "start" | "serve" | "play" | "done";

export type Paddle = {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
};

export type Ball = {
  x: number;
  y: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SoundName = "paddle_hit" | "wall_hit" | "score";
