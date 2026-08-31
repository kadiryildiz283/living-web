import { Direction } from "../types/enums";
import { ViewportState } from "../types/state";
import { CharacterRenderState, RenderFrame, Renderer } from "./Renderer";
import { sanitizeText, truncateText } from "../utils/security";

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 0
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
  }
}

export class CanvasRenderer implements Renderer {
  public canvas: HTMLCanvasElement | null = null;
  public context: CanvasRenderingContext2D | null = null;
  private isCustomCanvas: boolean = false;
  private container: HTMLElement | null = null;

  constructor(customCanvas?: HTMLCanvasElement) {
    if (customCanvas) {
      this.canvas = customCanvas;
      this.context = customCanvas.getContext("2d");
      this.isCustomCanvas = true;
    }
  }

  initialize(container?: HTMLElement | null): void {
    if (typeof document === "undefined") {
      return;
    }

    this.container = container || document.body;

    if (!this.canvas) {
      // Remove any existing overlay if hot-reloading
      const existing = document.querySelector('canvas[data-living-overlay="true"]');
      if (existing && existing.parentElement) {
        existing.parentElement.removeChild(existing);
      }

      this.canvas = document.createElement("canvas");
      this.canvas.setAttribute("data-living-overlay", "true");
      this.canvas.className = "living-web-overlay";
      this.canvas.style.position = "fixed";
      this.canvas.style.top = "0";
      this.canvas.style.left = "0";
      this.canvas.style.width = "100vw";
      this.canvas.style.height = "100vh";
      this.canvas.style.pointerEvents = "none";
      this.canvas.style.zIndex = "2147483647"; // Max z-index overlay
      this.context = this.canvas.getContext("2d");

      if (this.container) {
        this.container.appendChild(this.canvas);
      }
    }

    const width = typeof window !== "undefined" ? window.innerWidth : 1280;
    const height = typeof window !== "undefined" ? window.innerHeight : 800;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.resize({ width, height, devicePixelRatio: dpr, visible: true });
  }

  resize(viewport: ViewportState): void {
    if (!this.canvas) return;

    const dpr = viewport.devicePixelRatio || 1;
    this.canvas.width = Math.round(viewport.width * dpr);
    this.canvas.height = Math.round(viewport.height * dpr);
    this.canvas.style.width = `${viewport.width}px`;
    this.canvas.style.height = `${viewport.height}px`;

    if (this.context) {
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.scale(dpr, dpr);
    }
  }

  render(frame: RenderFrame): void {
    const ctx = this.context;
    if (!ctx || !this.canvas) return;

    const { characters, camera, viewport, debugSurfaces, debugMode } = frame;

    // 1. Clear full canvas
    ctx.clearRect(0, 0, viewport.width, viewport.height);

    // 2. Render debug platforms if enabled
    if (debugMode && debugSurfaces) {
      this.renderDebugSurfaces(ctx, debugSurfaces, camera);
    }

    // 3. Render each character
    for (const char of characters) {
      this.renderCharacter(ctx, char, camera, debugMode);
    }
  }

  private renderCharacter(
    ctx: CanvasRenderingContext2D,
    char: CharacterRenderState,
    camera: { x: number; y: number },
    debugMode?: boolean
  ): void {
    const screenX = char.position.x - camera.x;
    const screenY = char.position.y - camera.y;

    ctx.save();
    ctx.globalAlpha = char.opacity ?? 1.0;

    // Check if we have an image frame loaded
    const img = char.frameImage;
    const hasImage =
      img &&
      (img instanceof Image ||
        (typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap) ||
        (img.complete && !img.error && img.width > 0));

    if (hasImage) {
      ctx.save();
      if (char.direction === Direction.LEFT) {
        ctx.translate(screenX + char.width, screenY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, char.width, char.height);
      } else {
        ctx.drawImage(img, screenX, screenY, char.width, char.height);
      }
      ctx.restore();
    } else {
      // High-quality procedural pixel/vector animated fallback
      this.renderProceduralPet(ctx, screenX, screenY, char);
    }

    // Render Speech Bubble if active
    if (char.speech && Date.now() < char.speech.expiresAt) {
      this.renderSpeechBubble(ctx, screenX, screenY, char);
    }

    // Render character debug hitbox if debugMode
    if (debugMode) {
      ctx.strokeStyle = "rgba(255, 50, 50, 0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, char.width, char.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 4;
      ctx.fillText(
        `${char.animation} (${char.id}) ${char.grounded ? "[G]" : "[Air]"}`,
        screenX,
        screenY - 8
      );
      ctx.shadowColor = "transparent";
    }

    ctx.restore();
  }

  private renderProceduralPet(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    char: CharacterRenderState
  ): void {
    ctx.save();

    const w = char.width;
    const h = char.height;
    const isFlipped = char.direction === Direction.LEFT;

    if (isFlipped) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    // Body animation bounce
    const bounce =
      char.animation === "WALK"
        ? Math.sin(char.frameIndex * 1.5) * 3
        : char.animation === "RUN"
        ? Math.sin(char.frameIndex * 2.5) * 5
        : char.animation === "SLEEP"
        ? 4
        : 0;

    // Pet Shadow under feet
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.92, w * 0.38, h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pet Body (warm golden dog color)
    ctx.fillStyle = "#E69A38";
    ctx.beginPath();
    drawRoundedRect(ctx, w * 0.15, h * 0.35 + bounce, w * 0.7, h * 0.45, 12);
    ctx.fill();

    // Belly highlight
    ctx.fillStyle = "#FAD089";
    ctx.beginPath();
    drawRoundedRect(ctx, w * 0.3, h * 0.45 + bounce, w * 0.45, h * 0.3, 8);
    ctx.fill();

    // Head
    const headTilt = char.animation === "BARK" ? -4 : char.animation === "OBSERVE" ? 3 : 0;
    ctx.fillStyle = "#E69A38";
    ctx.beginPath();
    drawRoundedRect(ctx, w * 0.45, h * 0.15 + bounce + headTilt, w * 0.45, h * 0.45, 10);
    ctx.fill();

    // Ears (Floppy cute ears)
    ctx.fillStyle = "#C0701F";
    const earBounce = char.animation === "RUN" ? Math.sin(char.frameIndex * 3) * 6 : 0;
    ctx.beginPath();
    ctx.ellipse(
      w * 0.5,
      h * 0.2 + bounce + earBounce,
      w * 0.1,
      h * 0.22,
      Math.PI / 6,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Eyes
    if (char.animation === "SLEEP") {
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.35 + bounce, 4, 0, Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#1E1E1E";
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.32 + bounce, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye glimmer
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(w * 0.74, h * 0.3 + bounce, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snout / Nose
    ctx.fillStyle = "#1E1E1E";
    ctx.beginPath();
    ctx.ellipse(w * 0.88, h * 0.38 + bounce, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bark open mouth
    if (char.animation === "BARK") {
      ctx.fillStyle = "#FF6B6B";
      ctx.beginPath();
      ctx.arc(w * 0.82, h * 0.48 + bounce, 4, 0, Math.PI);
      ctx.fill();
    }

    // Tail (wagging)
    const tailWag = Math.sin(Date.now() / 120) * 0.4;
    ctx.strokeStyle = "#C0701F";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.5 + bounce);
    ctx.quadraticCurveTo(
      w * 0.02,
      h * 0.3 + bounce + tailWag * 10,
      w * 0.05,
      h * 0.2 + bounce + tailWag * 15
    );
    ctx.stroke();

    // Paws / Legs
    const legOffset =
      char.animation === "WALK" || char.animation === "RUN"
        ? Math.sin(char.frameIndex * 2) * 6
        : 0;

    ctx.fillStyle = "#C0701F";
    // Back left paw
    ctx.beginPath();
    drawRoundedRect(ctx, w * 0.22, h * 0.72 + bounce - legOffset, w * 0.14, h * 0.22, 4);
    ctx.fill();
    // Back right paw
    ctx.beginPath();
    drawRoundedRect(ctx, w * 0.38, h * 0.72 + bounce + legOffset, w * 0.14, h * 0.22, 4);
    ctx.fill();
    // Front left paw
    ctx.beginPath();
    drawRoundedRect(ctx, w * 0.62, h * 0.72 + bounce + legOffset, w * 0.14, h * 0.22, 4);
    ctx.fill();
    // Front right paw
    ctx.beginPath();
    drawRoundedRect(ctx, w * 0.76, h * 0.72 + bounce - legOffset, w * 0.14, h * 0.22, 4);
    ctx.fill();

    ctx.restore();
  }

  private renderSpeechBubble(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    char: CharacterRenderState
  ): void {
    if (!char.speech) return;

    const rawText = truncateText(char.speech.text, 60);
    const text = sanitizeText(rawText);

    ctx.save();
    ctx.font = "bold 12px sans-serif";
    const textMetrics = ctx.measureText(text);
    const bubbleWidth = Math.max(60, textMetrics.width + 24);
    const bubbleHeight = 28;
    const bubbleX = screenX + char.width / 2 - bubbleWidth / 2;
    const bubbleY = screenY - bubbleHeight - 14;

    // Draw speech bubble background
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    drawRoundedRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
    ctx.fill();

    // Draw bubble arrow / pointer
    ctx.beginPath();
    ctx.moveTo(bubbleX + bubbleWidth / 2 - 6, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight + 8);
    ctx.lineTo(bubbleX + bubbleWidth / 2 + 6, bubbleY + bubbleHeight);
    ctx.closePath();
    ctx.fill();

    // Reset shadow & draw text
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2);

    ctx.restore();
  }

  private renderDebugSurfaces(
    ctx: CanvasRenderingContext2D,
    surfaces: any[],
    camera: { x: number; y: number }
  ): void {
    ctx.save();
    ctx.lineWidth = 2;

    for (const s of surfaces) {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;

      if (s.type === "PLATFORM") {
        ctx.strokeStyle = "rgba(34, 197, 94, 0.9)";
        ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      } else if (s.type === "ATTRACTOR") {
        ctx.strokeStyle = "rgba(234, 179, 8, 0.9)";
        ctx.fillStyle = "rgba(234, 179, 8, 0.25)";
      } else {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
        ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      }

      ctx.fillRect(sx, sy, s.width, s.height);
      ctx.strokeRect(sx, sy, s.width, s.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 4;
      ctx.fillText(`[${s.type}] ${s.id}`, sx + 6, sy + 14);
      ctx.shadowColor = "transparent";
    }

    ctx.restore();
  }

  destroy(): void {
    if (this.canvas && !this.isCustomCanvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.context = null;
  }
}
