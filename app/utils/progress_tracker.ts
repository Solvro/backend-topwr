const REFRESH_INTERVAL = 100;

/**
 * Displays rounded percentage progress in the terminal at a fixed interval.
 * Call `update()` after each processed item and `done()` when processing ends.
 */
export default class ProgressTracker {
  private readonly total: number;
  private current: number;
  private lastRefresh: number;
  private rendered: boolean;
  private readonly name: string;

  /**
   * Creates a progress tracker. Refreshing starts on the first `update()` call.
   *
   * @param total - Total number of items to process; should be greater than zero.
   * @param name - Label displayed before the percentage. Defaults to "Progress".
   */
  constructor(total: number, name = "Progress") {
    this.total = total;
    this.name = name;
    this.current = 0;
    this.lastRefresh = performance.now();
    this.rendered = false;
  }

  /**
   * Increments the processed item count by one and starts the refresh timer
   * on the first call.git
   */
  public update(): void {
    this.current++;

    const now = performance.now();
    if (now - this.lastRefresh > REFRESH_INTERVAL) {
      this.lastRefresh = now;
      this.printProgress();
    }
  }

  private printProgress(): void {
    this.rendered = true;
    process.stdout.write(
      `\r│ ${this.name}: ${this.current} / ${this.total} - ${Math.round((this.current / this.total) * 100)}% `,
    );
  }

  /**
   * Prints 100% regardless of the processed item count
   */
  public done(): void {
    if (this.rendered) {
      process.stdout.write(
        `\r│ ${this.name}: ${this.current} / ${this.total} - 100% \n`,
      );
    }
  }
}
