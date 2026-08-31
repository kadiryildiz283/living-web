import { CameraState, Vector2 } from "../types/state";

export class CameraController {
  public state: CameraState = { x: 0, y: 0 };

  constructor(initialX: number = 0, initialY: number = 0) {
    this.state = { x: initialX, y: initialY };
  }

  update(scrollX: number, scrollY: number): void {
    this.state.x = scrollX;
    this.state.y = scrollY;
  }

  syncFromWindow(): void {
    if (typeof window !== "undefined") {
      this.state.x = window.scrollX || window.pageXOffset || 0;
      this.state.y = window.scrollY || window.pageYOffset || 0;
    }
  }

  worldToScreen(position: Vector2): Vector2 {
    return {
      x: position.x - this.state.x,
      y: position.y - this.state.y
    };
  }

  screenToWorld(position: Vector2): Vector2 {
    return {
      x: position.x + this.state.x,
      y: position.y + this.state.y
    };
  }
}
