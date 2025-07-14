import * as fs from "node:fs/promises";
import { Readable } from "node:stream";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import { ExternalDigitalGuideMode } from "#enums/digital_guide_mode";
import PolinkaStation from "#models/polinka_station";
import FilesService from "#services/files_service";

const assetsPath = "https://admin.topwr.solvro.pl/assets/";
const filesMetaPath = (id: string) =>
  `https://admin.topwr.solvro.pl/files/${id}?fields=filename_disk`;

interface SourceResponse<T> {
  data: T[];
}

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

const isValidPolinkaStationData = (
  data: unknown,
): data is SourceResponse<PolinkaStationDraft> =>
  isValidDataResponse<PolinkaStationDraft>(data);

export default class PolinkaStationScraper extends BaseScraperModule {
  static name = "Polinka Station";
  static description =
    'Scrapes polinkas stations from local file: "./assets/polinkas.json"';
  static taskTitle = "Scrape Polinka";

  async run(task: TaskHandle) {
    task.update("starting reading polinkas file...");

    const polinkaStationsData = await fs
      .readFile("./assets/polinka_stations.json", { encoding: "utf-8" })
      .then(JSON.parse)
      .then((data) => {
        if (!isValidPolinkaStationData(data)) {
          throw new Error(`
            Invalid JSON structure in ./assets/polinka_stations.json,
            expected type of Response<PolinkaStationDraft>
            `);
        }
        return data;
      });

    for (const polinkaStation of polinkaStationsData.data) {
      polinkaStation.photoKey = await this.uploadCoverAndGetKey(polinkaStation);
    }

    await PolinkaStation.createMany(polinkaStationsData.data);
    task.update("Polinka stations created!");
  }
  private async uploadCoverAndGetKey(
    data: PolinkaStationDraft,
  ): Promise<string | null> {
    const imageKey = data.photoKey;
    if (imageKey === null) {
      this.logger.warning(`no image for polinka station: [${data.name}]`);
      return null;
    }
    const extension = await this.findFileExtension(imageKey);

    const imageStream = await this.fetchAndCheckStatus(
      `${assetsPath}${imageKey}`,
      `image file ${imageKey}`,
    ).then((response) => response.body);
    if (imageStream === null) {
      throw new Error(
        `No file contents for ${imageKey} for polinka station: [${data.name}] under
      ${assetsPath}${imageKey}`,
      );
    }
    const file = await FilesService.uploadStream(
      Readable.fromWeb(imageStream),
      extension,
    ).addErrorContext(() => `Failed to upload file with key '${imageKey}'`);
    return file.id;
  }

  private async findFileExtension(file: string): Promise<string | undefined> {
    const extension = (await this.fetchJSON(
      filesMetaPath(file),
      `file meta of ${file}`,
    )) as { data: { filename_disk: string } };
    try {
      return extension.data.filename_disk.split(".").pop()?.toLowerCase();
    } catch (e) {
      throw new Error(`Failed to fetch extension for ${file}`, { cause: e });
    }
  }
}
