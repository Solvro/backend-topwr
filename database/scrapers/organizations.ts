import { Readable } from "node:stream";

import { BaseScraperModule } from "#commands/db_scrape";
import { LinkType } from "#enums/link_type";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationType } from "#enums/organization_type";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";
import FilesService from "#services/files_service";

interface DirectusResponse<T> {
  data: T[];
}
interface DirectusSingleResponse<T> {
  data: T;
}

interface DirectusTag {
  id: number;
  name: string;
}

interface DirectusLink {
  id: number;
  name: string;
  link: string;
  scientific_circle_id: number;
}

interface DirectusOrganization {
  id: number;
  date_created: string;
  date_updated: string;
  name: string;
  logo: string;
  cover: string;
  description: string;
  type: string;
  source: string;
  shortDescription: string;
  department: number;
  useCoverAsPreviewPhoto: boolean;
  isStrategic: boolean;
  tags: number[];
  links: number[];
}

interface FileMetaResponse {
  data: { filename_disk: string };
}
export default class OrganizationsScraper extends BaseScraperModule {
  static name = "Organizations";
  static description =
    "populates all required tables for organizations (tags, links,...)";
  static taskTitle = "Scraping organizations";
  private filesService = new FilesService();
  private readonly urls = {
    orgs: "https://admin.topwr.solvro.pl/items/Scientific_Circles",
    tags: "https://admin.topwr.solvro.pl/items/Tags",
    pivot_tags: "https://admin.topwr.solvro.pl/items/Scientific_Circles_Tags",
    links: "https://admin.topwr.solvro.pl/items/Scientific_Circles_Links",
  };
  private readonly linkDomains: [string, LinkType][] = [
    ["facebook.com", LinkType.Facebook],
    ["instagram.com", LinkType.Instagram],
    ["linkedin.com", LinkType.LinkedIn],
    ["youtube.com", LinkType.YouTube],
    ["github.com", LinkType.GitHub],
    ["x.com", LinkType.X],
    ["twitter.com", LinkType.X],
    ["discord.com", LinkType.Discord],
    ["discord.gg", LinkType.Discord],
    ["tiktok.com", LinkType.TikTok],
    ["twitch.tv", LinkType.Twitch],
  ];

  public async run() {
    const tags = (await this.fetchJSON(
      this.urls.tags,
      "tags",
    )) as DirectusResponse<DirectusTag>;
    const tagsModels = new Map(
      tags.data.map((tag) => [
        tag.id,
        { tag: tag.name } as StudentOrganizationTag,
      ]),
    );
    await StudentOrganizationTag.createMany([
      ...tagsModels.values().toArray(),
      { tag: "strategic" },
    ]);

    for (let id = 1342; id <= 1588; id++) {
      let res;
      try {
        res = (await this.fetchJSON(
          `${this.urls.orgs}/${id}`,
          `organization ${id}`,
        )) as DirectusSingleResponse<DirectusOrganization>;
      } catch (e) {
        this.logger.warning(e);
        continue;
      }
      const org = res.data;
      const logo =
        org.logo !== null && org.logo !== undefined
          ? await this.newAsset(org.logo)
          : null;
      const cover =
        org.cover !== null && org.cover !== undefined
          ? await this.newAsset(org.cover)
          : null;
      const orgModel = await StudentOrganization.create({
        id: org.id,
        name: org.name,
        departmentId: org.department,
        logo,
        cover,
        description: org.description,
        shortDescription: org.shortDescription,
        coverPreview: org.useCoverAsPreviewPhoto,
        source: this.convertSource(org.source),
        organizationType: this.convertType(org.type),
      });
      const a = org.tags
        .map((tagId) => tagsModels.get(tagId)?.tag)
        .filter((tagModel) => tagModel !== undefined);
      if (a.length < org.tags.length) {
        this.logger.warning(
          `There are some undefined tags in organization ${org.name}. Omitting these tags.`,
        );
      }
      if (org.isStrategic) {
        a.push("strategic");
      }
      await orgModel.related("tags").attach(a);
      const links = [];
      for (const linkId of org.links) {
        try {
          const resp = (await this.fetchJSON(
            `${this.urls.links}/${linkId}`,
            `link ${linkId}`,
          )) as DirectusSingleResponse<DirectusLink>;
          const link = resp.data;
          links.push({
            id: link.id,
            link: link.link,
            type: this.detectLinkType(link.link),
          } as StudentOrganizationLink);
        } catch (e) {
          this.logger.warning(`Failed to fetch link ${linkId}: ${e}`);
        }
      }
      await orgModel.related("links").createMany(links);
    }
  }

  private detectLinkType(link: string): LinkType {
    let url;
    try {
      url = new URL(link);
    } catch {
      this.logger.warning(
        `Failed to parse social link '${link}' - assigning the Default linktype`,
      );
      return LinkType.Default;
    }
    if (url.protocol === "mailto:") {
      return LinkType.Mail;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      this.logger.warning(
        `Encountered an unknown protocol '${url.protocol}' in social link '${link}' - assigning the Default linktype`,
      );
      return LinkType.Default;
    }
    for (const [domain, type] of this.linkDomains) {
      if (url.host === domain || url.host.endsWith(`.${domain}`)) {
        return type;
      }
    }
    this.logger.info(
      `Social link '${link}' matched no domains - assigning the Default linktype`,
    );
    return LinkType.Default;
  }

  private convertSource(source: string): OrganizationSource {
    switch (source) {
      case "student_department":
        return OrganizationSource.StudentDepartment;
      case "aktywni_website":
        return OrganizationSource.PwrActive;
      case "manual_entry":
        return OrganizationSource.Manual;
    }
    this.logger.warning(
      `Unknown source '${source}' - assigning the Manual source`,
    );
    return OrganizationSource.Manual;
  }

  private convertType(type: string): OrganizationType {
    switch (type) {
      case "scientific_cirlce": //XDDDDDD
        return OrganizationType.ScientificCircle;
      case "student_organization":
        return OrganizationType.StudentOrganization;
      case "student_media":
        return OrganizationType.StudentMedium;
      case "cultural_agenda":
        return OrganizationType.CultureAgenda;
      case "student_council":
        return OrganizationType.StudentCouncil;
    }
    this.logger.warning(
      `Unknown type '${type}' - assigning the Student Organization type`,
    );
    return OrganizationType.StudentOrganization;
  }
  private async newAsset(directusId: string): Promise<string> {
    const extension = (
      (await this.fetchJSON(
        `https://admin.topwr.solvro.pl/files/${directusId}?fields=filename_disk`,
        directusId,
      )) as FileMetaResponse
    ).data.filename_disk
      .split(".")
      .pop();
    if (extension === undefined) {
      this.logger.warning(
        `Failed to get extension for asset ${directusId} - using default 'bin'`,
      );
    }
    const imageStream = await this.fetchAndCheckStatus(
      `https://admin.topwr.solvro.pl/assets/${directusId}`,
      `image file ${directusId}`,
    ).then((response) => response.body);
    if (imageStream === null) {
      throw new Error(`Failed to get image stream for asset ${directusId}`);
    }
    return this.filesService.uploadStream(
      Readable.fromWeb(imageStream),
      extension,
    );
  }
}
