import { WorldSnapshot, WorldSurface, WorldBounds } from "../types/world";
import { SurfaceType } from "../types/enums";
import { WorldModel } from "../world/WorldModel";

export class WorldBuilder {
  build(snapshot: WorldSnapshot): WorldModel {
    const surfaces = this.filterAndDeduplicate(snapshot.surfaces);
    
    // Calculate world bounds from surfaces + viewport
    let minX = 0;
    let minY = 0;
    let maxX = snapshot.viewport.width || 1280;
    let maxY = snapshot.viewport.height || 800;

    for (const surface of surfaces) {
      if (surface.x < minX) minX = surface.x;
      if (surface.y < minY) minY = surface.y;
      if (surface.x + surface.width > maxX) maxX = surface.x + surface.width;
      if (surface.y + surface.height > maxY) maxY = surface.y + surface.height;
    }

    // Add a virtual floor platform at the bottom of the world to guarantee safe fallback
    const floorY = maxY - 10;
    const virtualFloor: WorldSurface = {
      id: "world-virtual-floor",
      x: minX,
      y: floorY,
      width: maxX - minX,
      height: 20,
      type: SurfaceType.PLATFORM,
      priority: 0.1
    };

    surfaces.push(virtualFloor);

    const bounds: WorldBounds = { minX, minY, maxX, maxY };
    return new WorldModel(surfaces, bounds, snapshot.zones || []);
  }

  merge(previous: WorldModel, snapshot: WorldSnapshot): WorldModel {
    const updated = this.build(snapshot);
    return updated;
  }

  private filterAndDeduplicate(surfaces: WorldSurface[]): WorldSurface[] {
    const filtered: WorldSurface[] = [];
    const seenIds = new Set<string>();

    for (const surface of surfaces) {
      if (surface.type === SurfaceType.IGNORE) {
        continue;
      }
      if (surface.width < 10 || surface.height < 5) {
        continue;
      }
      if (seenIds.has(surface.id)) {
        continue;
      }

      seenIds.add(surface.id);
      filtered.push(surface);
    }

    return filtered;
  }
}
