export type FrameCallback = (deltaMs: number, timestamp: number) => void;

export class GameLoop {
  public targetFPS: number = 60;
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private lastTime: number = 0;
  private rafId: any = null;
  private onFrameCallback: FrameCallback | null = null;

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
  }

  setFrameCallback(callback: FrameCallback): void {
    this.onFrameCallback = callback;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    this.scheduleNextFrame();
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      if (typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(this.rafId);
      } else {
        clearTimeout(this.rafId);
      }
      this.rafId = null;
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  tick(manualTimestamp?: number): void {
    const now = manualTimestamp ?? (typeof performance !== "undefined" ? performance.now() : Date.now());
    const rawDelta = now - this.lastTime;
    this.lastTime = now;

    // Cap deltaMs to 100ms (0.1s) to prevent physics tunneling or spiral of death during lag spikes
    const deltaMs = Math.min(Math.max(rawDelta, 1), 100);

    if (!this.isPaused && this.onFrameCallback) {
      this.onFrameCallback(deltaMs, now);
    }
  }

  private scheduleNextFrame(): void {
    if (!this.isRunning) return;

    if (typeof requestAnimationFrame !== "undefined") {
      this.rafId = requestAnimationFrame((timestamp) => {
        this.tick(timestamp);
        this.scheduleNextFrame();
      });
    } else {
      // Fallback for node or tests
      const frameInterval = Math.round(1000 / this.targetFPS);
      this.rafId = setTimeout(() => {
        this.tick();
        this.scheduleNextFrame();
      }, frameInterval);
    }
  }
}
