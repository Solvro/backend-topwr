import * as fs from "node:fs/promises";

import {
  BaseScraperModule,
  SourceResponse,
  TaskHandle,
  assertResponseStructure,
} from "#commands/db_scrape";
import { ExternalDigitalGuideMode } from "#enums/digital_guide_mode";
import Campus from "#models/campus";
import PolinkaStation from "#models/polinka_station";

interface PolinkaStationDraft {
  name: string;
  campusId: number;
  latitude: number;
  longitude: number;
  address_line1: string;
  address_line2: string;
  photoKey: string | null;
  externalDigitalGuideIdOrURL: string;
  externalDigitalGuideMode: ExternalDigitalGuideMode | null;
}

export default class PolinkaStationScraper extends BaseScraperModule {
  static name = "Polinka Station";
  static description =
    'Scrapes polinkas stations from local file: "./assets/polinka_stations.json"';
  static taskTitle = "Scrape Polinka Stations";

  async shouldRun(): Promise<boolean> {
    return (
      (await this.modelHasNoRows(PolinkaStation)) &&
      !(await this.modelHasNoRows(Campus))
    ); //Cannot run Polinka Stations without Campus
  }

  async run(task: TaskHandle) {
    task.update("starting reading polinkas file...");

    const polinkaStationsData = (await fs
      .readFile("./assets/polinka_stations.json", { encoding: "utf-8" })
      .then(JSON.parse)
      .then((data) =>
        assertResponseStructure(data, "Polinka stations JSON"),
      )) as SourceResponse<PolinkaStationDraft>;

    for (const polinkaStation of polinkaStationsData.data) {
      polinkaStation.photoKey =
        polinkaStation.photoKey === null
          ? null
          : await this.directusUploadFieldAndGetKey(
              polinkaStation.photoKey,
            ).addErrorContext(
              `Failed to upload the cover photo for polinka: ${polinkaStation.name}`,
            );
    }

    await PolinkaStation.createMany(polinkaStationsData.data);
    task.update("Polinka stations created!");
  }
}
