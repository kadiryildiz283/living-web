import { SurfaceType } from "../types/enums";
import { WorldConfig } from "../types/config";

const DEFAULT_IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "SVG",
  "PATH",
  "CANVAS",
  "AUDIO",
  "VIDEO",
  "SOURCE",
  "HEAD",
  "META",
  "LINK"
]);

const SEMANTIC_PLATFORM_TAGS = new Set([
  "HEADER",
  "NAV",
  "MAIN",
  "SECTION",
  "ARTICLE",
  "ASIDE",
  "FOOTER",
  "BUTTON",
  "TABLE",
  "IMG",
  "PICTURE",
  "BLOCKQUOTE",
  "PRE"
]);

export class ElementClassifier {
  private config: WorldConfig;

  constructor(config: WorldConfig = {}) {
    this.config = config;
  }

  isIgnored(element: Element): boolean {
    if (!element || !(element instanceof Element)) {
      return true;
    }

    const tagName = element.tagName.toUpperCase();
    if (DEFAULT_IGNORED_TAGS.has(tagName)) {
      return true;
    }

    // Check data-living-ignore attribute
    if (element.hasAttribute("data-living-ignore")) {
      return true;
    }

    // Check living web overlay element itself
    if (element.hasAttribute("data-living-overlay") || element.classList.contains("living-web-overlay")) {
      return true;
    }

    // Check custom ignored selectors
    if (this.config.ignoredSelectors && this.config.ignoredSelectors.length > 0) {
      for (const selector of this.config.ignoredSelectors) {
        try {
          if (element.matches(selector)) {
            return true;
          }
        } catch {
          // ignore invalid selector
        }
      }
    }

    // Check computed style visibility if window/getComputedStyle is available
    if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
      try {
        const style = window.getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          parseFloat(style.opacity || "1") <= 0.01
        ) {
          return true;
        }
      } catch {
        // Continue
      }
    }

    return false;
  }

  classify(element: Element): SurfaceType {
    if (this.isIgnored(element)) {
      return SurfaceType.IGNORE;
    }

    // Explicit data attributes take highest precedence
    if (element.hasAttribute("data-living-platform")) {
      return SurfaceType.PLATFORM;
    }
    if (element.hasAttribute("data-living-attractor")) {
      return SurfaceType.ATTRACTOR;
    }
    if (element.hasAttribute("data-living-hazard")) {
      return SurfaceType.HAZARD;
    }
    if (element.hasAttribute("data-living-wall")) {
      return SurfaceType.WALL;
    }

    // Check custom platform selectors
    if (this.config.platformSelectors && this.config.platformSelectors.length > 0) {
      for (const selector of this.config.platformSelectors) {
        try {
          if (element.matches(selector)) {
            return SurfaceType.PLATFORM;
          }
        } catch {
          // ignore
        }
      }
    }

    // If semantic detection is enabled or by default
    if (this.config.useSemanticElements !== false) {
      const tagName = element.tagName.toUpperCase();
      if (SEMANTIC_PLATFORM_TAGS.has(tagName)) {
        return SurfaceType.PLATFORM;
      }

      // Check common CSS platform classes
      const className = typeof element.className === "string" ? element.className.toLowerCase() : "";
      if (
        className.includes("card") ||
        className.includes("btn") ||
        className.includes("button") ||
        className.includes("container") ||
        className.includes("panel") ||
        className.includes("box") ||
        className.includes("banner") ||
        className.includes("hero") ||
        className.includes("toolbar") ||
        className.includes("nav") ||
        className.includes("menu") ||
        className.includes("footer")
      ) {
        return SurfaceType.PLATFORM;
      }
    }

    // Generic div / paragraph / heading check if large enough
    const tagName = element.tagName.toUpperCase();
    if (["DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI"].includes(tagName)) {
      return SurfaceType.PLATFORM;
    }

    return SurfaceType.IGNORE;
  }

  score(element: Element): number {
    let score = 1.0;
    if (element.hasAttribute("data-living-platform")) score += 2.0;
    if (element.hasAttribute("data-living-attractor")) score += 3.0;

    const tagName = element.tagName.toUpperCase();
    if (["HEADER", "NAV", "MAIN", "SECTION", "ARTICLE", "FOOTER"].includes(tagName)) {
      score += 1.5;
    }

    return score;
  }
}
