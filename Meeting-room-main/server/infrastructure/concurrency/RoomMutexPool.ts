export class RoomMutexPool {
  private static instance: RoomMutexPool;
  private queues: Map<number, Promise<void>> = new Map();

  private constructor() {}

  static getInstance(): RoomMutexPool {
    if (!RoomMutexPool.instance) {
      RoomMutexPool.instance = new RoomMutexPool();
    }
    return RoomMutexPool.instance;
  }

  async runWithLock<T>(roomId: number, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(roomId) || Promise.resolve();

    let releaseLock: () => void;
    const current = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.queues.set(roomId, previous.then(() => current));

    try {
      await previous;
      return await task();
    } finally {
      releaseLock!();

      if (this.queues.get(roomId) === current) {
        this.queues.delete(roomId);
      }
    }
  }
}
