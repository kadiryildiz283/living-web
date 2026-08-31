import { WorldConfig } from "../types/config";
import { WorldSnapshot, WorldSurface, InteractionZone } from "../types/world";
import { ElementClassifier } from "./ElementClassifier";
import { GeometryResolver } from "./GeometryResolver";
import { SurfaceType } from "../types/enums";

export class DOMScanner {
  private config: WorldConfig;
  private classifier: ElementClassifier;
  private geometry: GeometryResolver;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private debounceTimer: any = null;
  private root: Element | null = null;
  private onReconcileCallbacks: Set<(snapshot: WorldSnapshot) => void> = new Set();
  private surfaceCounter: number = 0;

  constructor(config: WorldConfig = {}) {
    this.config = config;
    this.classifier = new ElementClassifier(config);
    this.geometry = new GeometryResolver();
  }

  scan(root?: Element): WorldSnapshot {
    const targetRoot = root || this.root || (typeof document !== "undefined" ? document.body : null);
    this.root = targetRoot;

    const surfaces: WorldSurface[] = [];
    const zones: InteractionZone[] = [];
    const viewport = this.geometry.resolveViewport();

    if (targetRoot && typeof targetRoot.querySelectorAll === "function") {
      // Find candidate elements: semantic containers, data attributes, buttons, images, cards
      const elements = targetRoot.querySelectorAll(
        "header, nav, main, section, article, aside, footer, button, a, img, [data-living-platform], [data-living-attractor], [data-living-hazard], [data-living-wall], [data-living-ignore], .card, .container, .box, .panel, h1, h2, h3, p, div"
      );

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (this.classifier.isIgnored(el)) {
          continue;
        }

        const type = this.classifier.classify(el);
        if (type === SurfaceType.IGNORE) {
          continue;
        }

        const rect = this.geometry.measure(el);
        if (rect.width <= 10 || rect.height <= 5) {
          continue;
        }

        const id = el.id || `surface-${++this.surfaceCounter}-${el.tagName.toLowerCase()}`;
        const priority = this.classifier.score(el);

        const surface: WorldSurface = {
          id,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          type,
          priority,
          source: el
        };

        surfaces.push(surface);

        if (type === SurfaceType.ATTRACTOR || el.hasAttribute("data-living-attractor")) {
          const attractionType = el.getAttribute("data-living-attractor") || "play";
          zones.push({
            id: `zone-${id}`,
            bounds: rect,
            type: attractionType,
            attraction: 1.0
          });
        }
      }
    }

    const snapshot: WorldSnapshot = {
      surfaces,
      zones,
      viewport,
      timestamp: Date.now()
    };

    return snapshot;
  }

  startObserving(root?: Element): void {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
      return;
    }

    const target = root || this.root || (typeof document !== "undefined" ? document.body : null);
    if (!target) return;
    this.root = target;

    this.stopObserving();

    // 1. Mutation Observer
    this.mutationObserver = new MutationObserver((mutations) => {
      let isRelevant = false;
      for (const mut of mutations) {
        if (mut.type === "childList" || (mut.type === "attributes" && mut.attributeName?.startsWith("data-living-"))) {
          isRelevant = true;
          break;
        }
      }

      if (isRelevant) {
        this.debouncedReconcile();
      }
    });

    try {
      this.mutationObserver.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-living-platform", "data-living-ignore", "data-living-attractor", "class", "style"]
      });
    } catch {
      // Ignore observation failure in edge environments
    }

    // 2. Resize Observer if available
    if (typeof ResizeObserver !== "undefined") {
      try {
        this.resizeObserver = new ResizeObserver(() => {
          this.debouncedReconcile();
        });
        this.resizeObserver.observe(target);
      } catch {
        // Ignore
      }
    }
  }

  stopObserving(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  reconcile(): WorldSnapshot {
    const snapshot = this.scan();
    for (const callback of this.onReconcileCallbacks) {
      callback(snapshot);
    }
    return snapshot;
  }

  onReconcile(callback: (snapshot: WorldSnapshot) => void): () => void {
    this.onReconcileCallbacks.add(callback);
    return () => this.onReconcileCallbacks.delete(callback);
  }

  private debouncedReconcile(): void {
    const interval = this.config.scanIntervalMs || 250;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.reconcile();
    }, interval);
  }
}
