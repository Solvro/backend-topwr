import * as fs from "node:fs/promises";

import {
  BaseScraperModule,
  SourceResponse,
  TaskHandle,
  assertResponseStructure,
} from "#commands/db_scrape";
import { ExternalDigitalGuideMode } from "#enums/digital_guide_mode";
import Building from "#models/building";
import Campus from "#models/campus";
import { convertDateOrFallbackToNow } from "#utils/date";
import { fixSequence } from "#utils/db";

const buildingsPath = "https://admin.topwr.solvro.pl/items/Buildings/";

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
  externalDigitalGuideMode: ExternalDigitalGuideMode | null;
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

  async shouldRun(): Promise<boolean> {
    return await this.modelHasNoRows(Campus, Building);
  }

  async run(task: TaskHandle) {
    task.update("starting reading campuses file...");
    const campusesData = (await fs
      .readFile("./assets/campuses.json", { encoding: "utf-8" })
      .then(JSON.parse)
      .then((response) => {
        assertResponseStructure(response);
        return response;
      })) as SourceResponse<CampusDraft>;
    const campusesMap = new Map<string, Campus>();
    for (const data of campusesData.data) {
      const campus = await Campus.create(data);
      for (const buildingIdentifier of data.buildings) {
        campusesMap.set(buildingIdentifier, campus);
      }
    }
    task.update("campuses created!");
    task.update("starting fetching buildings...");
    const buildingsData = (await this.fetchJSON(
      buildingsPath,
      "list of buildings from directus",
    ).then((response) => {
      assertResponseStructure(response);
      return response;
    })) as SourceResponse<BuildingDraft>;
    const formattedBuildingData = await Promise.all(
      buildingsData.data.map(async (data) => {
        const addressArray = data.addres.split(",");
        return {
          id: data.id,
          identifier: data.name,
          specialName: data.naturalName,
          addressLine1: addressArray.shift(),
          addressLine2: addressArray.shift(),
          latitude: data.latitude,
          longitude: data.longitude,
          haveFood: data.food ?? false,
          coverKey: await this.semaphore.runTask(() =>
            this.directusUploadFieldAndGetKey(data.cover),
          ),
          externalDigitalGuideMode: data.externalDigitalGuideMode,
          externalDigitalGuideIdOrUrl: data.externalDigitalGuideIdOrURL,
          createdAt: convertDateOrFallbackToNow(data.createdAt),
          updatedAt: convertDateOrFallbackToNow(data.updatedAt),
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
          buildingEntry.coverKey !== null &&
          campus.coverKey === buildingEntry.identifier
        ) {
          campus.coverKey = buildingEntry.coverKey;
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
}
