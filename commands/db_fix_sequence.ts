import { BaseCommand, args } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";

import { fixSequence } from "#utils/db";

export default class DbFixSequence extends BaseCommand {
  static readonly commandName = "db:fix-sequence";
  static readonly description =
    "Fixes the autoincrement sequence on a given table";

  static readonly options: CommandOptions = {
    startApp: true,
  };

  @args.string({
    required: true,
  })
  declare tableName: string;

  @args.string({
    default: "id",
    required: true,
  })
  declare columnName: string;

  @args.string({
    required: false,
  })
  declare sequenceName: string | undefined;

  async run() {
    const nextVal = await fixSequence(
      this.tableName,
      this.columnName,
      this.sequenceName,
    );
    this.logger.info(
      `Autoincrement sequence for ${this.tableName}.${this.columnName} updated to ${nextVal}`,
    );
  }
}
