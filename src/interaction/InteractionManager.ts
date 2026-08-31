import { InteractionConfig } from "../types/config";
import { InteractionType } from "../types/enums";
import { InteractionEvent, InteractionSnapshot } from "../types/events";
import { CharacterState, Vector2 } from "../types/state";
import { distance, pointInRect } from "../utils/math";

export class InteractionManager {
  private config: InteractionConfig;
  private listeners: Set<(event: InteractionEvent) => void> = new Set();
  private snapshot: InteractionSnapshot = {
    pointerNear: false,
    pointerOver: false,
    dragged: false,
    scrolling: false,
    lastAction: "none"
  };
  private isPointerDown: boolean = false;
  private pointerPosition: Vector2 = { x: 0, y: 0 };
  private scrollTimeout: any = null;
  private boundHandlers: Record<string, any> = {};

  constructor(config: InteractionConfig = {}) {
    this.config = {
      draggable: config.draggable ?? true,
      clickActions: config.clickActions ?? true,
      hoverActions: config.hoverActions ?? true,
      followPointer: config.followPointer ?? false
    };
  }

  start(target: Window | HTMLElement = typeof window !== "undefined" ? window : (null as any)): void {
    if (!target || typeof target.addEventListener !== "function") {
      return;
    }

    this.boundHandlers.pointermove = (e: PointerEvent | MouseEvent) => this.handlePointerMove(e);
    this.boundHandlers.pointerdown = (e: PointerEvent | MouseEvent) => this.handlePointerDown(e);
    this.boundHandlers.pointerup = (e: PointerEvent | MouseEvent) => this.handlePointerUp(e);
    this.boundHandlers.scroll = () => this.handleScroll();
    this.boundHandlers.visibilitychange = () => this.handleVisibilityChange();
    this.boundHandlers.resize = () => this.handleResize();

    target.addEventListener("pointermove", this.boundHandlers.pointermove as any);
    target.addEventListener("pointerdown", this.boundHandlers.pointerdown as any);
    target.addEventListener("pointerup", this.boundHandlers.pointerup as any);
    target.addEventListener("scroll", this.boundHandlers.scroll as any, { passive: true });

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.boundHandlers.visibilitychange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.boundHandlers.resize);
    }
  }

  stop(target: Window | HTMLElement = typeof window !== "undefined" ? window : (null as any)): void {
    if (!target || typeof target.removeEventListener !== "function") {
      return;
    }

    if (this.boundHandlers.pointermove) target.removeEventListener("pointermove", this.boundHandlers.pointermove as any);
    if (this.boundHandlers.pointerdown) target.removeEventListener("pointerdown", this.boundHandlers.pointerdown as any);
    if (this.boundHandlers.pointerup) target.removeEventListener("pointerup", this.boundHandlers.pointerup as any);
    if (this.boundHandlers.scroll) target.removeEventListener("scroll", this.boundHandlers.scroll as any);

    if (typeof document !== "undefined" && this.boundHandlers.visibilitychange) {
      document.removeEventListener("visibilitychange", this.boundHandlers.visibilitychange);
    }
    if (typeof window !== "undefined" && this.boundHandlers.resize) {
      window.removeEventListener("resize", this.boundHandlers.resize);
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  update(character: CharacterState, scrollX: number = 0, scrollY: number = 0): void {
    const worldPointer: Vector2 = {
      x: this.pointerPosition.x + scrollX,
      y: this.pointerPosition.y + scrollY
    };

    const charCenter: Vector2 = {
      x: character.x + character.width / 2,
      y: character.y + character.height / 2
    };

    const dist = distance(worldPointer, charCenter);
    this.snapshot.pointerNear = dist < 160;
    this.snapshot.pointerPosition = worldPointer;

    const charRect = {
      x: character.x,
      y: character.y,
      width: character.width,
      height: character.height
    };

    this.snapshot.pointerOver = pointInRect(worldPointer, charRect);

    if (this.isPointerDown && this.snapshot.pointerOver && this.config.draggable) {
      this.snapshot.dragged = true;
      character.x = worldPointer.x - character.width / 2;
      character.y = worldPointer.y - character.height / 2;
      character.vx = 0;
      character.vy = 0;
    }
  }

  private handlePointerMove(e: PointerEvent | MouseEvent): void {
    this.pointerPosition = { x: e.clientX, y: e.clientY };
  }

  private handlePointerDown(e: PointerEvent | MouseEvent): void {
    this.isPointerDown = true;
    this.pointerPosition = { x: e.clientX, y: e.clientY };

    if (this.snapshot.pointerOver) {
      this.emit({
        type: InteractionType.CLICK,
        timestamp: Date.now(),
        position: this.pointerPosition
      });
      this.snapshot.lastAction = "click";
    }
  }

  private handlePointerUp(e: PointerEvent | MouseEvent): void {
    this.isPointerDown = false;
    if (this.snapshot.dragged) {
      this.snapshot.dragged = false;
      this.emit({
        type: InteractionType.DRAG_END,
        timestamp: Date.now(),
        position: { x: e.clientX, y: e.clientY }
      });
    }
  }

  private handleScroll(): void {
    this.snapshot.scrolling = true;
    this.emit({
      type: InteractionType.SCROLL_START,
      timestamp: Date.now(),
      position: this.pointerPosition
    });

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.snapshot.scrolling = false;
      this.emit({
        type: InteractionType.SCROLL_END,
        timestamp: Date.now(),
        position: this.pointerPosition
      });
    }, 150);
  }

  private handleVisibilityChange(): void {
    const isHidden = typeof document !== "undefined" && document.hidden;
    this.emit({
      type: isHidden ? InteractionType.TAB_HIDDEN : InteractionType.TAB_VISIBLE,
      timestamp: Date.now(),
      position: this.pointerPosition
    });
  }

  private handleResize(): void {
    this.emit({
      type: InteractionType.RESIZE,
      timestamp: Date.now(),
      position: this.pointerPosition
    });
  }

  emit(event: InteractionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Interaction listener error:", err);
      }
    }
  }

  on(listener: (event: InteractionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): InteractionSnapshot {
    return { ...this.snapshot };
  }
}
