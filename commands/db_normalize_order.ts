import { BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";

import { normalizeOrderField } from "#utils/db";

export default class DbNormalizeOrder extends BaseCommand {
  static commandName = "db:normalize-order";
  static description =
    "Replaces the order columns with a fresh integer sequence, keeping the entry order unchanged";
  private orderedTables = ["contributors", "guide_articles", "guide_questions"];

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.boolean({
    description: "Don't ask for confirmation",
  })
  declare force: boolean;

  async run() {
    if (this.force) {
      this.logger.warning("Force flag passed - confirmation skipped");
    } else {
      const confirmation = await this.prompt.confirm(
        "Warning: this command will update order fields for all applicable tables. The frontend might malfunction if someone is currently viewing/editing ordered tables. Continue?",
        { default: false },
      );
      if (!confirmation) {
        this.logger.info("Cancelled.");
        this.exitCode = 1;
        return;
      }
    }

    const tasks = this.ui.tasks();
    for (const table of this.orderedTables) {
      tasks.add(`Normalize order for table "${table}"`, async () => {
        await normalizeOrderField(table);
        return "done";
      });
    }
    await tasks.run();
    this.exitCode = tasks.getState() === "succeeded" ? 0 : 1;
  }
}
