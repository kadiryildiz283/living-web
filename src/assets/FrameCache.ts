export class FrameCache {
  private frames: Map<string, any> = new Map();

  get(url: string): any {
    return this.frames.get(url);
  }

  set(url: string, image: any): void {
    this.frames.set(url, image);
  }

  has(url: string): boolean {
    return this.frames.has(url);
  }

  delete(url: string): boolean {
    return this.frames.delete(url);
  }

  clear(): void {
    this.frames.clear();
  }

  get size(): number {
    return this.frames.size;
  }
}
