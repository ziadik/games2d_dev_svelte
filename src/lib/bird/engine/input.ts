export class InputManager {
  private keysPressed = new Set<string>();
  private mousePressed = new Set<number>();
  private keysDown = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => {
      if (!this.keysDown.has(e.key)) {
        this.keysPressed.add(e.key);
      }
      this.keysDown.add(e.key);
    });

    window.addEventListener("keyup", (e) => {
      this.keysDown.delete(e.key);
    });

    window.addEventListener("mousedown", (e) => {
      this.mousePressed.add(e.button);
    });
  }

  wasKeyPressed(key: string): boolean {
    return this.keysPressed.has(key);
  }

  isKeyDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  wasMousePressed(button: number): boolean {
    return this.mousePressed.has(button);
  }

  endFrame() {
    this.keysPressed.clear();
    this.mousePressed.clear();
  }
}

export const input = new InputManager();
