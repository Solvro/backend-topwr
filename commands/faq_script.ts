import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";

import { faqScript } from "../scripts/faq_script.js";

export default class FaqScript extends BaseCommand {
  static commandName = "faq:script";
  static description = "";

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
    await faqScript();
  }
}
