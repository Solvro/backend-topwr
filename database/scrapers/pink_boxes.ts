import * as fs from "node:fs/promises";

import {
  BaseScraperModule,
  SourceResponse,
  TaskHandle,
  assertResponseStructure,
} from "#commands/db_scrape";
import Building from "#models/building";
import PinkBox from "#models/pink_box";

interface PinkBoxDraft {
  roomOrNearby: string | null;
  floor: string | null;
  latitude: number;
  longitude: number;
  buildingId: number;
  photoKey?: string | null;
}

export default class PinkBoxScraper extends BaseScraperModule {
  static name = "Pink boxes";
  static description =
    'Scrapes pink boxes from local file: "./assets/pink_boxes.json"';
  static taskTitle = "Scrape pink boxes";

  async shouldRun(): Promise<boolean> {
    return (
      (await this.modelHasNoRows(PinkBox)) &&
      !(await this.modelHasNoRows(Building))
    ); //Cannot run Pink Boxes without buildings
  }

  async run(task: TaskHandle) {
    task.update("starting reading pink boxes file...");
    const pinkBoxesData = (await fs
      .readFile("./assets/pink_boxes.json", { encoding: "utf-8" })
      .then(JSON.parse)
      .then((data) =>
        assertResponseStructure(data, "Pink boxes JSON"),
      )) as SourceResponse<PinkBoxDraft>;
    await PinkBox.createMany(pinkBoxesData.data);
    task.update("Pink boxes created!");
  }
}
