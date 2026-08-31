import { describe, it, expect } from "vitest";
import { CanvasRenderer } from "../src/renderer/CanvasRenderer";
import { Direction } from "../src/types/enums";
import { RenderFrame } from "../src/renderer/Renderer";

describe("CanvasRenderer", () => {
  it("initializes canvas overlay and handles resize", () => {
    const renderer = new CanvasRenderer();
    renderer.initialize();

    expect(renderer.canvas).toBeDefined();
    expect(renderer.canvas?.getAttribute("data-living-overlay")).toBe("true");

    renderer.resize({
      width: 1920,
      height: 1080,
      devicePixelRatio: 2,
      visible: true
    });

    expect(renderer.canvas?.style.width).toBe("1920px");
    expect(renderer.canvas?.style.height).toBe("1080px");
    expect(renderer.canvas?.width).toBe(3840);
    expect(renderer.canvas?.height).toBe(2160);
  });

  it("executes render pipeline without errors", () => {
    const renderer = new CanvasRenderer();
    renderer.initialize();

    const frame: RenderFrame = {
      characters: [
        {
          id: "pet-1",
          position: { x: 100, y: 150 },
          width: 48,
          height: 48,
          animation: "WALK",
          frameIndex: 0,
          direction: Direction.RIGHT,
          opacity: 1.0,
          speech: {
            text: "Hello Living Web!",
            expiresAt: Date.now() + 5000
          },
          grounded: true
        }
      ],
      camera: { x: 0, y: 0 },
      viewport: { width: 1280, height: 800, devicePixelRatio: 1, visible: true },
      debugSurfaces: [
        {
          id: "debug-platform",
          x: 50,
          y: 200,
          width: 300,
          height: 40,
          type: "PLATFORM" as any,
          priority: 1
        }
      ],
      debugMode: true
    };

    expect(() => renderer.render(frame)).not.toThrow();
  });

  it("cleans up on destroy", () => {
    const renderer = new CanvasRenderer();
    renderer.initialize();
    const canvasRef = renderer.canvas;

    renderer.destroy();
    expect(renderer.canvas).toBeNull();
    expect(renderer.context).toBeNull();
  });
});
