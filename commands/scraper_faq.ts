import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";

import { faqScript } from "../scripts/faq_script.js";

export default class ScraperFaq extends BaseCommand {
  static commandName = "scraper:faq";
  static description = "This command runs the FAQ scraper script.";

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
    await faqScript();
  }
}
