export type BatchReadyHandler = (batch: string) => void;

/**
 * Collects text until no new output arrives for delayMs.
 * The latest completed batch remains available until cleared or replaced.
 */
export class OutputBuffer {
  private pending = "";
  private latest = "";
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly delayMs = 10_000,
    private readonly onBatchReady: BatchReadyHandler = () => undefined,
  ) {}

  append(chunk: string): void {
    if (!chunk) {
      return;
    }

    this.pending += chunk;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    if (!this.pending) {
      return;
    }

    this.latest = this.pending;
    this.pending = "";
    this.onBatchReady(this.latest);
  }

  get latestBatch(): string {
    return this.latest;
  }

  get hasPendingOutput(): boolean {
    return this.pending.length > 0;
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    this.pending = "";
    this.latest = "";
  }

  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
