import { DateTime } from "luxon";
import * as fs from "node:fs/promises";
import { Readable } from "node:stream";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import { stringToLinkType } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";
import FilesService from "#services/files_service";

const ABOUT_US_PATH = "https://admin.topwr.solvro.pl/items/AboutUs/";
const LINKS_JSON_PATH = "./assets/about_us_links.json";
const ASSETS_PATH = "https://admin.topwr.solvro.pl/assets/";
const filesMetaPath = (id: string) =>
  `https://admin.topwr.solvro.pl/files/${id}?fields=filename_disk`;

interface SourceResponse<T> {
  data: T[];
}

interface AboutUsDraft {
  id: number;
  description: string;
  cover: string | null;
  solvroSocialLinks: number[];
  date_updated: string;
  user_updated: string;
}

interface SocialLinkDraft {
  linkType: string;
  link: string;
}

export default class AboutUsScraper extends BaseScraperModule {
  static name = "`About Us` general information";
  static description = "Updates about us information from Directus";
  static taskTitle = "Update `About Us` information";

  async shouldRun(): Promise<boolean> {
    return await this.modelHasNoRows(AboutUsGeneral, AboutUsGeneralLink);
  }

  async run(task: TaskHandle) {
    task.update("Fetching About Us data...");
    const body = (await this.fetchJSON(ABOUT_US_PATH, "About Us data")) as {
      data: AboutUsDraft;
    };
    task.update("Filling the database...");
    const draft = body.data;
    const formattedAboutUsData = {
      description: draft.description,
      coverPhotoKey: await this.semaphore.runTask(() =>
        this.uploadCoverAndGetKey(draft).then((value) => value ?? undefined),
      ),
      createdAt: resolveDate(draft.date_updated), //no date created provided in the response
      updatedAt: resolveDate(draft.date_updated),
    };
    await AboutUsGeneral.create(formattedAboutUsData);
    task.update("About Us created!");
    task.update(`Loading About Us links from ${LINKS_JSON_PATH}...`);
    const linkData = await fs
      .readFile(LINKS_JSON_PATH, { encoding: "utf-8" })
      .then(JSON.parse)
      .then((data) => {
        if (!isValidLinkData(data)) {
          throw new Error(`
            Invalid JSON structure in ${LINKS_JSON_PATH},
            expected type of Response<SocialLinkDraft>
            `);
        }
        return data;
      });
    await AboutUsGeneralLink.createMany(
      linkData.data.map((linkDraft) => {
        return {
          ...linkDraft,
          linkType: stringToLinkType(linkDraft.linkType),
        };
      }),
    );
    task.update("About Us links created!");
  }

  private async uploadCoverAndGetKey(
    data: AboutUsDraft,
  ): Promise<string | null> {
    const imageKey = data.cover;
    if (imageKey === null) {
      this.logger.warning(`no image for building: [${data.id}]`);
      return null;
    }
    const extension = await this.findFileExtension(imageKey);
    const imageStream = await this.fetchAndCheckStatus(
      `${ASSETS_PATH}${imageKey}`,
      `image file ${imageKey}`,
    ).then((response) => response.body);
    if (imageStream === null) {
      throw new Error(
        `No file contents for ${imageKey} for building: [${data.id}] under
      ${ASSETS_PATH}${imageKey}`,
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

const isValidLinkData = (
  data: unknown,
): data is SourceResponse<SocialLinkDraft> =>
  isValidDataResponse<SocialLinkDraft>(data);
