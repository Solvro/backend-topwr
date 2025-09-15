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
  static name = "CMS cache reference number";
  static description = "CMS cache ref number and last updated datetime";
  static taskTitle =
    "Scrape the cms cache ref number with last updated datetime";

  async run(task: TaskHandle) {
    task.update("Fetching the cache reference number...");
    const fetched = (await this.fetchJSON(
      "https://admin.topwr.solvro.pl/items/CacheReferenceNumber",
      "CacheReferenceNumber",
    )) as CacheReferenceData;

    const lastUpdated = DateTime.fromISO(fetched.data.date_updated);

    task.update("Creating the cms cache reference number");
    await MobileConfig.create({
      cmsReferenceNumber: fetched.data.referenceNumber,
      createdAt: lastUpdated,
      updatedAt: lastUpdated,
    }); //day swap lookahead defaults to 7
    task.update("CMS cache reference number migrated");
  }
}
