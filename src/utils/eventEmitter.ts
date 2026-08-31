export type Listener<T = any> = (data: T) => void;

export class EventEmitter<Events extends Record<string, any> = Record<string, any>> {
  private listeners: Map<keyof Events, Set<Listener<any>>> = new Map();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => this.off(event, listener);
  }

  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const wrapper: Listener<Events[K]> = (data: Events[K]) => {
      this.off(event, wrapper);
      listener(data);
    };
    return this.on(event, wrapper);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      // Create a shallow copy to prevent issues if listeners modify the set
      for (const listener of Array.from(set)) {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error in event listener for "${String(event)}":`, err);
        }
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
