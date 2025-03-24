import { DateTime } from "luxon";
import * as fs from "node:fs/promises";
import { Readable } from "node:stream";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import { BuildingIcon } from "#enums/building_icon";
import Building from "#models/building";
import Campus from "#models/campus";
import FilesService from "#services/files_service";
import { fixSequence } from "#utils/db";

const buildingsPath = "https://admin.topwr.solvro.pl/items/Buildings/";
const assetsPath = "https://admin.topwr.solvro.pl/assets/";
const filesMetaPath = (id: string) =>
  `https://admin.topwr.solvro.pl/files/${id}?fields=filename_disk`;

interface SourceResponse<T> {
  data: T[];
}

interface BuildingDraft {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  addres: string; //intentional typo
  cover: string | null;
  food: boolean | null;
  naturalName: string;
  externalDigitalGuideIdOrURL: string;
  externalDigitalGuideMode: string;
  createdAt: string;
  updatedAt: string;
}

interface CampusDraft {
  name: string;
  cover: string;
  buildings: string[];
}

export default class BuildingsScraper extends BaseScraperModule {
  static name = "Buildings and campuses";
  static description =
    "Scrapes pwr buildings data from directus and campuses from local file: './assets/campuses.json'";
  static taskTitle = "Scrape buildings and campuses";

  async run(task: TaskHandle) {
    task.update("starting reading campuses file...");
    const campusesData = await fs
      .readFile("./assets/campuses.json", { encoding: "utf-8" })
      .then(JSON.parse)
      .then((data) => {
        if (!isValidCampusesData(data)) {
          throw new Error(`
            Invalid JSON structure in ./assets/campuses.json,
            expected type of Response<CampusDraft>
            `);
        }
        return data;
      });
    const campusesMap = new Map<string, Campus>();
    for (const data of campusesData.data) {
      const campus = await Campus.create(data);
      for (const buildingIdentifier of data.buildings) {
        campusesMap.set(buildingIdentifier, campus);
      }
    }
    task.update("campuses created!");
    task.update("starting fetching buildings...");
    const buildingsData = await this.fetchJSON(
      buildingsPath,
      "list of buildings from directus",
    );
    if (!isValidBuildingsData(buildingsData)) {
      throw new Error(`
        Invalid data type fetched from ${buildingsPath},
        expected type of Response<BuildingDraft>
        `);
    }
    const formattedBuildingData = await Promise.all(
      buildingsData.data.map(async (data) => {
        const addressArray = data.addres.split(",");
        return {
          id: data.id,
          identifier: data.name,
          specialName: data.naturalName,
          iconType: BuildingIcon.Icon,
          addressLine1: addressArray.shift(),
          addressLine2: addressArray.shift(),
          latitude: data.latitude,
          longitude: data.longitude,
          haveFood: data.food ?? false,
          cover: await this.semaphore.runTask(() =>
            this.uploadCoverAndGetKey(data),
          ),
          externalDigitalGuideMode: data.externalDigitalGuideMode,
          externalDigitalGuideIdOrUrl: data.externalDigitalGuideIdOrURL,
          createdAt: resolveDate(data.createdAt),
          updatedAt: resolveDate(data.updatedAt),
        };
      }),
    );
    const updatedCampuses: Campus[] = [];
    await Building.createMany(
      formattedBuildingData.map((buildingEntry) => {
        const campus = campusesMap.get(buildingEntry.identifier);
        if (campus === undefined) {
          throw new Error(`
          No campus assigned to building ${buildingEntry.identifier}
          foreign key constraint will not be met for buildings table
          `);
        }
        // swap campus cover placeholder (building identifier) for real cover key
        if (
          buildingEntry.cover !== null &&
          campus.cover === buildingEntry.identifier
        ) {
          campus.cover = buildingEntry.cover;
          updatedCampuses.push(campus);
        }
        return {
          campusId: campus.id,
          ...buildingEntry,
        };
      }),
    );
    task.update("Buildings created !");
    await fixSequence("buildings", "id");
    task.update("Fixed Buildings id autoincrementing");
    //save changes for campuses
    await Promise.all(updatedCampuses.map((campus) => campus.save()));
    task.update("campuses cover assigned !");
  }

  private async uploadCoverAndGetKey(
    data: BuildingDraft,
  ): Promise<string | null> {
    const imageKey = data.cover;
    if (imageKey === null) {
      this.logger.warning(`no image for building: [${data.id}]`);
      return null;
    }
    const extension = await this.findFileExtension(imageKey);
    const imageStream = await this.fetchAndCheckStatus(
      `${assetsPath}${imageKey}`,
      `image file ${imageKey}`,
    ).then((response) => response.body);
    if (imageStream === null) {
      throw new Error(
        `No file contents for ${imageKey} for building: [${data.id}] under
      ${assetsPath}${imageKey}`,
      );
    }
    try {
      return await FilesService.uploadStream(
        Readable.fromWeb(imageStream),
        extension,
      );
    } catch (err) {
      throw new Error(`failed to upload the file: ${imageKey}`, {
        cause: err,
      });
    }
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

function resolveDate(dateString: string): DateTime<true> {
  const date = DateTime.fromISO(dateString);
  return date.isValid ? date : DateTime.now();
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

const isValidCampusesData = (
  data: unknown,
): data is SourceResponse<CampusDraft> =>
  isValidDataResponse<CampusDraft>(data);

const isValidBuildingsData = (
  data: unknown,
): data is SourceResponse<BuildingDraft> =>
  isValidDataResponse<BuildingDraft>(data);
