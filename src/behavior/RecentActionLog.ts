export interface ActionRecord {
  action: string;
  timestamp: number;
}

export class RecentActionLog {
  private history: ActionRecord[] = [];
  private maxHistory: number = 20;

  record(action: string): void {
    this.history.unshift({
      action,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  penalty(action: string, windowMs: number = 10000): number {
    const now = Date.now();
    let count = 0;

    for (const item of this.history) {
      if (now - item.timestamp > windowMs) {
        break;
      }
      if (item.action === action) {
        count++;
      }
    }

    // Return penalty factor (0 to 1)
    return Math.min(1, count * 0.25);
  }

  getRecent(limit: number = 5): string[] {
    return this.history.slice(0, limit).map((h) => h.action);
  }

  clear(): void {
    this.history = [];
  }
}
