import { Rect, ViewportState } from "../types/state";

export class GeometryResolver {
  measure(element: Element): Rect {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const clientRect = element.getBoundingClientRect();
    const scrollX = typeof window !== "undefined" ? window.scrollX || window.pageXOffset || 0 : 0;
    const scrollY = typeof window !== "undefined" ? window.scrollY || window.pageYOffset || 0 : 0;

    return {
      x: clientRect.left + scrollX,
      y: clientRect.top + scrollY,
      width: clientRect.width,
      height: clientRect.height
    };
  }

  resolveViewport(): ViewportState {
    const width = typeof window !== "undefined" ? window.innerWidth : 1280;
    const height = typeof window !== "undefined" ? window.innerHeight : 800;
    const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const visible = typeof document !== "undefined" ? !document.hidden : true;

    return {
      width,
      height,
      devicePixelRatio,
      visible
    };
  }

  getDocumentBounds(): { width: number; height: number } {
    if (typeof document === "undefined") {
      return { width: 1280, height: 800 };
    }

    const body = document.body;
    const html = document.documentElement;

    const width = Math.max(
      body?.scrollWidth || 0,
      body?.offsetWidth || 0,
      html?.clientWidth || 0,
      html?.scrollWidth || 0,
      html?.offsetWidth || 0,
      window.innerWidth || 1280
    );

    const height = Math.max(
      body?.scrollHeight || 0,
      body?.offsetHeight || 0,
      html?.clientHeight || 0,
      html?.scrollHeight || 0,
      html?.offsetHeight || 0,
      window.innerHeight || 800
    );

    return { width, height };
  }
}
