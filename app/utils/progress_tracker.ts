/**
 * Displays rounded percentage progress in the terminal at a fixed interval.
 * Call `update()` after each processed item and `done()` when processing ends.
 */
export default class ProgressTracker {
  private readonly total: number;
  private actual = 0;
  private refreshInterval = 0;
  private lastRefresh = 0;
  private readonly name: string;

  /**
   * Creates a progress tracker. Refreshing starts on the first `update()` call.
   *
   * @param total - Total number of items to process; should be greater than zero.
   * @param refreshInterval - Time between terminal updates, in milliseconds.
   * @param name - Label displayed before the percentage. Defaults to "Progress".
   */
  constructor(total: number, refreshInterval: number, name = "Progress") {
    this.total = total;
    this.refreshInterval = refreshInterval;
    this.name = name;
  }

  /**
   * Increments the processed item count by one and starts the refresh timer
   * on the first call.git
   */
  public update(): void {
    const now = performance.now();

    if (
      this.lastRefresh === 0 ||
      now - this.lastRefresh > this.refreshInterval
    ) {
      this.lastRefresh = now;
      this.printProgress();
    }
    this.actual++;
  }

  private printProgress(): void {
    process.stdout.write(
      `\r ${this.name}: ${Math.round((this.actual / this.total) * 100)}% `,
    );
  }

  /**
   * Prints 100% regardless of the processed item count, stops the refresh timer

   */
  public done(): void {
    process.stdout.write(`\r ${this.name}: 100% `);
  }
}
