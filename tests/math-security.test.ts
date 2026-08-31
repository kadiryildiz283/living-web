import { describe, it, expect } from "vitest";
import { clamp, lerp, distance, pointInRect, rectIntersects, rectOverlapArea } from "../src/utils/math";
import { sanitizeText, truncateText } from "../src/utils/security";
import { EventEmitter } from "../src/utils/eventEmitter";

describe("Math Utilities", () => {
  it("clamps values between min and max", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("lerps smoothly between values", () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it("calculates Euclidean distance correctly", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
  });

  it("detects points inside rects", () => {
    const rect = { x: 10, y: 10, width: 50, height: 50 };
    expect(pointInRect({ x: 20, y: 20 }, rect)).toBe(true);
    expect(pointInRect({ x: 5, y: 20 }, rect)).toBe(false);
    expect(pointInRect({ x: 70, y: 20 }, rect)).toBe(false);
  });

  it("detects rect intersections", () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 10, y: 10, width: 20, height: 20 };
    const c = { x: 30, y: 30, width: 20, height: 20 };

    expect(rectIntersects(a, b)).toBe(true);
    expect(rectIntersects(a, c)).toBe(false);
  });

  it("computes overlapping area", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(rectOverlapArea(a, b)).toBe(25);
  });
});

describe("Security Utilities", () => {
  it("sanitizes HTML characters in text", () => {
    const dirty = '<script>alert("pwned")</script> & " \' /';
    const clean = sanitizeText(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("&lt;script&gt;");
    expect(clean).toContain("&amp;");
    expect(clean).toContain("&quot;");
  });

  it("truncates text with ellipsis", () => {
    const longText = "This is a very long string that should be truncated properly for speech bubbles";
    const truncated = truncateText(longText, 20);
    expect(truncated.length).toBe(20);
    expect(truncated.endsWith("...")).toBe(true);
  });
});

describe("EventEmitter Utility", () => {
  it("registers and triggers listeners", () => {
    const emitter = new EventEmitter<{ test: { val: number } }>();
    let received = 0;
    const unsub = emitter.on("test", (d) => {
      received = d.val;
    });

    emitter.emit("test", { val: 42 });
    expect(received).toBe(42);

    unsub();
    emitter.emit("test", { val: 100 });
    expect(received).toBe(42);
  });

  it("handles once listeners", () => {
    const emitter = new EventEmitter<{ single: string }>();
    let count = 0;
    emitter.once("single", () => {
      count++;
    });

    emitter.emit("single", "first");
    emitter.emit("single", "second");
    expect(count).toBe(1);
  });
});
