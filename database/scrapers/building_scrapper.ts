import { DateTime } from "luxon";
import * as fs from "node:fs/promises";
import { Readable } from "node:stream";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import { BuildingIcon } from "#enums/building_icon";
import Building from "#models/building";
import Campus from "#models/campus";
import FilesService from "#services/files_service";

const buildingsPath = "https://admin.topwr.solvro.pl/items/Buildings";
const assetsPath = "https://admin.topwr.solvro.pl/assets/";

interface BuildingsData {
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

interface CampusesData {
  data: {
    name: string;
    cover: string;
    buildings: string[];
  }[];
}

export default class BuildingScrapper extends BaseScraperModule {
  name = "building and campuses scrapper";
  description =
    "scrapes pwr buildings data from directus and campuses from local file: './assets/campuses.json'";

  private filesService = new FilesService();

  async run(task: TaskHandle) {
    try {
      this.logger.info("starting reading campuses file...");
      const campusesData = JSON.parse(
        await fs.readFile("./assets/campuses.json", { encoding: "utf-8" }),
      ) as CampusesData | undefined;
      if (campusesData === undefined) {
        throw new Error("failed reading ./assets/campuses.json");
      }
      const campusesMap = new Map<string, Campus>();
      for (const data of campusesData.data) {
        const campus = await Campus.create(data);
        data.buildings.forEach((building) => campusesMap.set(building, campus));
      }
      this.logger.info("campuses created!");

      this.logger.info("starting fetching buildings...");
      const response = await fetch(buildingsPath);
      if (!response.ok) {
        throw new Error(
          `Error: ${response.status} ` + `cause: ${response.statusText}`,
        );
      }
      const buildingsBody = (await response.json()) as
        | { data: BuildingsData[] }
        | undefined;
      if (buildingsBody === undefined) {
        throw new Error("failed fetching buildings: empty body");
      }
      const buildingsData = buildingsBody.data;

      const formattedBuildingData = await Promise.all(
        buildingsData.map(async (data) => {
          const addressArray = data.addres.split(",");
          return {
            id: data.id,
            identifier: data.name,
            specialName: data.naturalName,
            iconType: BuildingIcon.Icon,
            campusId: -1,
            addressLine1: addressArray.shift(),
            addressLine2: addressArray.shift(),
            latitude: data.latitude,
            longitude: data.longitude,
            haveFood: data.food ?? false,
            cover: await this.uploadAndGetKey(data),
            externalDigitalGuideMode: data.externalDigitalGuideMode,
            externalDigitalGuideIdOrURL: data.externalDigitalGuideIdOrURL,
            createdAt: resolveDate(data.createdAt),
            updatedAt: resolveDate(data.updatedAt),
          };
        }),
      );
      for (const buildingEntry of formattedBuildingData) {
        const campus = campusesMap.get(buildingEntry.identifier);
        if (campus === undefined) {
          this.logger.error(
            `No campus assigned to building ${buildingEntry.identifier}`,
          );
        } else {
          // update campuses
          campus.cover = buildingEntry.cover;
          buildingEntry.campusId = campus.id;
          await campus.save();
        }
      }
      await Building.createMany(formattedBuildingData);
      this.logger.info("Buildings created !");
      task.update(`finished running ${this.name} scrapper`);
    } catch (err) {
      this.logger.error("error within buildings and campuses scrapper");
      throw new Error(`${err}`);
    }
  }

  private async uploadAndGetKey(data: BuildingsData): Promise<string> {
    try {
      const imageKey = data.cover;
      if (imageKey === null) {
        this.logger.warning(`no image for building: [${data.id}]`);
        return "";
      }
      const response = await fetch(`${assetsPath}${imageKey}`);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const body = response.body;
      if (body === null) {
        throw new Error(
          `No file contents for ${imageKey} for building: [${data.id}]`,
        );
      }
      let mediaType = "";
      for (const [header, value] of response.headers.entries()) {
        if (header === "content-type") {
          if (value.startsWith("image")) {
            mediaType = value.split("/").pop() ?? "";
          }
        }
      }
      return await this.filesService.uploadStream(
        Readable.fromWeb(body),
        mediaType,
      );
    } catch (err) {
      this.logger.error(`failed to upload the files: ${err}`);
      return "";
    }
  }
}

function resolveDate(dateString: string): DateTime<true> {
  const date = DateTime.fromISO(dateString);
  return date.isValid ? date : DateTime.local();
}
