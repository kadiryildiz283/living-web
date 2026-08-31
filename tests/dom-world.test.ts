import { describe, it, expect } from "vitest";
import { ElementClassifier } from "../src/dom/ElementClassifier";
import { GeometryResolver } from "../src/dom/GeometryResolver";
import { WorldBuilder } from "../src/dom/WorldBuilder";
import { DOMScanner } from "../src/dom/DOMScanner";
import { WorldModel } from "../src/world/WorldModel";
import { SurfaceType } from "../src/types/enums";

describe("ElementClassifier", () => {
  it("classifies semantic HTML tags and data attributes", () => {
    const classifier = new ElementClassifier();

    const header = document.createElement("header");
    expect(classifier.classify(header)).toBe(SurfaceType.PLATFORM);

    const button = document.createElement("button");
    expect(classifier.classify(button)).toBe(SurfaceType.PLATFORM);

    const customPlatform = document.createElement("div");
    customPlatform.setAttribute("data-living-platform", "true");
    expect(classifier.classify(customPlatform)).toBe(SurfaceType.PLATFORM);

    const attractor = document.createElement("div");
    attractor.setAttribute("data-living-attractor", "toy");
    expect(classifier.classify(attractor)).toBe(SurfaceType.ATTRACTOR);

    const ignored = document.createElement("div");
    ignored.setAttribute("data-living-ignore", "true");
    expect(classifier.isIgnored(ignored)).toBe(true);
    expect(classifier.classify(ignored)).toBe(SurfaceType.IGNORE);
  });

  it("respects custom ignored selectors", () => {
    const classifier = new ElementClassifier({
      ignoredSelectors: [".no-pet", "#ad-banner"]
    });

    const ad = document.createElement("div");
    ad.id = "ad-banner";
    expect(classifier.isIgnored(ad)).toBe(true);

    const normal = document.createElement("div");
    normal.className = "normal-panel";
    expect(classifier.isIgnored(normal)).toBe(false);
  });
});

describe("GeometryResolver and DOMScanner", () => {
  it("scans container elements and builds snapshot", () => {
    const container = document.createElement("div");
    const header = document.createElement("header");
    header.id = "main-header";
    header.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 60,
      width: 800,
      height: 60,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-living-platform", "true");
    card.getBoundingClientRect = () => ({
      left: 100,
      top: 200,
      right: 300,
      bottom: 350,
      width: 200,
      height: 150,
      x: 100,
      y: 200,
      toJSON: () => {}
    });

    container.appendChild(header);
    container.appendChild(card);

    const scanner = new DOMScanner();
    const snapshot = scanner.scan(container);

    expect(snapshot.surfaces.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.surfaces.some((s) => s.id === "main-header")).toBe(true);
  });
});

describe("WorldModel & WorldBuilder", () => {
  it("builds world model from snapshot with virtual floor", () => {
    const builder = new WorldBuilder();
    const snapshot = {
      surfaces: [
        {
          id: "platform-1",
          x: 100,
          y: 200,
          width: 300,
          height: 40,
          type: SurfaceType.PLATFORM,
          priority: 2
        }
      ],
      viewport: { width: 1000, height: 600, devicePixelRatio: 1, visible: true },
      timestamp: Date.now()
    };

    const world = builder.build(snapshot);
    expect(world.surfaces.length).toBe(2); // platform-1 + virtual floor
    expect(world.bounds.maxX).toBeGreaterThanOrEqual(1000);
  });

  it("finds ground below a specific point", () => {
    const world = new WorldModel([
      {
        id: "top-shelf",
        x: 50,
        y: 100,
        width: 200,
        height: 20,
        type: SurfaceType.PLATFORM,
        priority: 1
      },
      {
        id: "bottom-shelf",
        x: 50,
        y: 300,
        width: 200,
        height: 20,
        type: SurfaceType.PLATFORM,
        priority: 1
      }
    ]);

    const ground = world.getGroundBelow(100, 50);
    expect(ground?.id).toBe("top-shelf");

    const lowerGround = world.getGroundBelow(100, 150);
    expect(lowerGround?.id).toBe("bottom-shelf");
  });

  it("calculates safe spawn position", () => {
    const world = new WorldModel([
      {
        id: "hero-platform",
        x: 200,
        y: 300,
        width: 400,
        height: 50,
        type: SurfaceType.PLATFORM,
        priority: 3
      }
    ]);

    const spawn = world.findSafeSpawn(40, 40);
    expect(spawn.x).toBeGreaterThanOrEqual(200);
    expect(spawn.y).toBe(260); // 300 - 40
  });
});
