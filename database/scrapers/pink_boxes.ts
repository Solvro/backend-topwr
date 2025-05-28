import * as fs from "node:fs/promises";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import PinkBox from "#models/pink_box";

interface SourceResponse<T> {
  data: T[];
}

interface PinkBoxDraft {
  roomOrNearby: string | null;
  floor: string | null;
  latitude: number;
  longitude: number;
  buildingId: number;
  photoKey?: string | null;
}

function isValidDataResponse<T>(
  response: unknown,
): response is SourceResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    Array.isArray(response.data)
  );
}

const isValidPinkBoxData = (
  data: unknown,
): data is SourceResponse<PinkBoxDraft> =>
  isValidDataResponse<PinkBoxDraft>(data);

export default class PinkBoxScraper extends BaseScraperModule {
  static name = "Pink boxes";
  static description =
    'Scrapes pink boxes from local file: "./assets/pink_boxes.json"';
  static taskTitle = "Scrape pink boxes";

  async run(task: TaskHandle) {
    task.update("starting reading pink boxes file...");
    const pinkBoxesData = await fs
      .readFile("./assets/pink_boxes.json", { encoding: "utf-8" })
      .then(JSON.parse)
      .then((data) => {
        if (!isValidPinkBoxData(data)) {
          throw new Error(`
                    Invalid JSON structure in ./assets/pink_boxes.json,
                    expected type of Response<PinkBoxDraft>
                    `);
        }
        return data;
      });
    await PinkBox.createMany(pinkBoxesData.data);
    task.update("Pink boxes created!");
  }
}
