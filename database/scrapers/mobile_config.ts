import { DateTime } from "luxon";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import MobileConfig from "#models/mobile_config";

interface CacheReferenceData {
  data: {
    referenceNumber: number;
    date_updated: string;
  };
}

export default class CacheReferenceNumberScraper extends BaseScraperModule {
  static name = "Cache reference number";
  static description = "Cache ref number and last updated datetime";
  static taskTitle = "Scrape the cache ref number with last updated datetime";

  async run(task: TaskHandle) {
    task.update("Fetching the cache reference number...");
    const fetched = (await this.fetchJSON(
      "https://admin.topwr.solvro.pl/items/CacheReferenceNumber",
      "CacheReferenceNumber",
    )) as CacheReferenceData;

    const lastUpdated = DateTime.fromISO(fetched.data.date_updated);

    task.update("Creating the cache reference number");
    await MobileConfig.create({
      referenceNumber: fetched.data.referenceNumber,
      createdAt: lastUpdated,
      updatedAt: lastUpdated,
    }); //day swap lookahead defaults to 7
    task.update("Cache reference number migrated");
  }
}
