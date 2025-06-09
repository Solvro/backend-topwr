import * as fs from "node:fs/promises";
import { Readable } from "node:stream";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
//import { BuildingIcon } from "#enums/building_icon";
import { ExternalDigitalGuideMode } from "#enums/digital_guide_mode";
import Polinka from "#models/polinka";
import FilesService from "#services/files_service";

const assetsPath = "https://admin.topwr.solvro.pl/assets/";
const filesMetaPath = (id: string) =>
  `https://admin.topwr.solvro.pl/files/${id}?fields=filename_disk`;

interface SourceResponse<T> {
  data: T[];
}

interface PolinkaDraft {
  name: string;
  latitude: number;
  longitude: number;
  addres: string; //intentional typo
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

const isValidPolinkaData = (
  data: unknown,
): data is SourceResponse<PolinkaDraft> =>
  isValidDataResponse<PolinkaDraft>(data);

export default class PolinkaScraper extends BaseScraperModule {
  static name = "Polinka";
  static description =
    'Scrapes polinkas stations from local file: "./assets/polinkas.json"';
  static taskTitle = "Scrape Polinka";

  async run(task: TaskHandle) {
    task.update("starting reading polinkas file...");

    const polinkasData = await fs
      .readFile("./assets/polinkas.json", { encoding: "utf-8" })
      .then(JSON.parse)
      .then((data) => {
        if (!isValidPolinkaData(data)) {
          throw new Error(`
            Invalid JSON structure in ./assets/polinkas.json,
            expected type of Response<PolinkaDraft>
            `);
        }
        return data;
      });

    for (const polinka of polinkasData.data) {
      polinka.photoKey = await this.semaphore.runTask(() =>
        this.uploadCoverAndGetKey(polinka),
      );
    }

    await Polinka.createMany(polinkasData.data);
    task.update("Polinka created!");
  }
  private async uploadCoverAndGetKey(
    data: PolinkaDraft,
  ): Promise<string | null> {
    const imageKey = data.photoKey;
    if (imageKey === null) {
      this.logger.warning(`no image for polinka: [${data.name}]`);
      return null;
    }
    const extension = await this.findFileExtension(imageKey);

    const imageStream = await this.fetchAndCheckStatus(
      `${assetsPath}${imageKey}`,
      `image file ${imageKey}`,
    ).then((response) => response.body);
    if (imageStream === null) {
      throw new Error(
        `No file contents for ${imageKey} for polinka: [${data.name}] under
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
