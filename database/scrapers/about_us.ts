import * as fs from "node:fs/promises";

import {
  BaseScraperModule,
  TaskHandle,
  assertResponseStructure,
} from "#commands/db_scrape";
import { stringToLinkType } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";
import { convertDateOrFallbackToNow } from "#utils/date";

const ABOUT_US_PATH = "https://admin.topwr.solvro.pl/items/AboutUs/";
const LINKS_JSON_PATH = "./assets/about_us_links.json";

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
    if (draft.cover === null) {
      throw new Error("About Us cover photo is missing");
    }
    const formattedAboutUsData = {
      description: draft.description,
      coverPhotoKey: await this.directusUploadFieldAndGetKey(draft.cover),
      createdAt: convertDateOrFallbackToNow(draft.date_updated), //no date created provided in the response
      updatedAt: convertDateOrFallbackToNow(draft.date_updated),
    };
    await AboutUsGeneral.create(formattedAboutUsData);
    task.update("About Us created!");
    task.update(`Loading About Us links from ${LINKS_JSON_PATH}...`);
    const linkData = (await fs
      .readFile(LINKS_JSON_PATH, { encoding: "utf-8" })
      .then(JSON.parse)
      .then((data) =>
        assertResponseStructure(data, "About Us links JSON"),
      )) as SourceResponse<SocialLinkDraft>;
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
}
