export interface ScheduledTask {
  id: string;
  task: () => void;
  dueTime: number;
}

export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private taskCounter: number = 0;

  schedule(task: () => void, delayMs: number): string {
    const id = `task-${++this.taskCounter}`;
    const dueTime = Date.now() + delayMs;
    this.tasks.set(id, { id, task, dueTime });
    return id;
  }

  cancel(id: string): void {
    this.tasks.delete(id);
  }

  flushDue(now: number = Date.now()): void {
    const dueIds: string[] = [];

    for (const [id, scheduled] of this.tasks.entries()) {
      if (scheduled.dueTime <= now) {
        dueIds.push(id);
      }
    }

    for (const id of dueIds) {
      const scheduled = this.tasks.get(id);
      if (scheduled) {
        this.tasks.delete(id);
        try {
          scheduled.task();
        } catch (err) {
          console.error("Error executing scheduled task:", err);
        }
      }
    }
  }

  clear(): void {
    this.tasks.clear();
  }
}
