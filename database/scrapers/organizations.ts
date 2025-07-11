import {
  BaseScraperModule,
  SourceResponse,
  TaskHandle,
} from "#commands/db_scrape";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationStatus } from "#enums/organization_status";
import { OrganizationType } from "#enums/organization_type";
import Department from "#models/department";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";
import { fixSequence } from "#utils/db";

interface DirectusTag {
  id: number;
  name: string;
}

interface DirectusLink {
  id: number;
  name: string;
  link: string;
  scientific_circle_id: number | null;
}

interface DirectusOrganization {
  id: number;
  date_created: string;
  date_updated: string;
  name: string;
  logo: string | null;
  cover: string | null;
  description: string | null;
  type: string;
  source: string;
  shortDescription: string | null;
  department: number | null;
  useCoverAsPreviewPhoto: boolean;
  isStrategic: boolean;
  tags: number[];
  links: number[];
}

interface DirectusTagPivot {
  id: number;
  Scientific_Circles_id: number | null;
  Tags_id: number | null;
}

export default class OrganizationsScraper extends BaseScraperModule {
  static name = "Organizations";
  static description =
    "populates all required tables for organizations (tags, links,...)";
  static taskTitle = "Scraping organizations";
  private readonly urls = {
    orgs: "https://admin.topwr.solvro.pl/items/Scientific_Circles?limit=-1",
    tags: "https://admin.topwr.solvro.pl/items/Tags",
    pivot_tags:
      "https://admin.topwr.solvro.pl/items/Scientific_Circles_Tags?limit=-1",
    links:
      "https://admin.topwr.solvro.pl/items/Scientific_Circles_Links?limit=-1",
  };

  async shouldRun(): Promise<boolean> {
    return (
      (await this.modelHasNoRows(
        StudentOrganization,
        StudentOrganizationTag,
      )) && !(await this.modelHasNoRows(Department))
    ); //Cannot run without Departments
  }

  public async run(task: TaskHandle) {
    const [orgs, tags, links, tagsPivot] = (await Promise.all([
      this.fetchDirectusJSON(this.urls.orgs, "organizations"),
      this.fetchDirectusJSON(this.urls.tags, "tags"),
      this.fetchDirectusJSON(this.urls.links, "links"),
      this.fetchDirectusJSON(this.urls.pivot_tags, "pivot tags"),
    ])) as [
      SourceResponse<DirectusOrganization>,
      SourceResponse<DirectusTag>,
      SourceResponse<DirectusLink>,
      SourceResponse<DirectusTagPivot>,
    ];
    task.update("Fetching...");
    const tagsModels = new Map(
      tagsPivot.data.map((pivotCol) => [
        pivotCol.id,
        {
          tag: tags.data.find((tag) => tag.id === pivotCol.Tags_id)?.name,
        },
      ]),
    );
    task.update("Creating tags...");
    await StudentOrganizationTag.createMany(
      tags.data.map((tag) => {
        return {
          tag: tag.name,
        };
      }),
    );
    task.update("Creating organizations...");
    for (const org of orgs.data) {
      const logoKey =
        org.logo !== null
          ? await this.directusUploadFieldAndGetKey(org.logo).addErrorContext(
              `Logo upload for Organization ${org.id} failed.`,
            )
          : null;
      const coverKey =
        org.cover !== null
          ? await this.directusUploadFieldAndGetKey(org.cover).addErrorContext(
              `Cover upload for Organization ${org.id} failed.`,
            )
          : null;
      const orgModel = await StudentOrganization.create({
        id: org.id,
        name: org.name,
        departmentId: org.department,
        logoKey,
        coverKey,
        description: org.description,
        shortDescription: org.shortDescription,
        coverPreview: org.useCoverAsPreviewPhoto,
        source: this.convertSource(org.source),
        organizationType: this.convertType(org.type),
        organizationStatus: OrganizationStatus.Unknown,
        isStrategic: org.isStrategic,
      });
      const undefinedTags = [];
      const tagNames = [];
      for (const tagId of org.tags) {
        const tagModel = tagsModels.get(tagId);
        if (tagModel?.tag === undefined) {
          undefinedTags.push(tagId);
          continue;
        }
        tagNames.push(tagModel.tag);
      }
      if (undefinedTags.length > 0) {
        this.logger.warning(
          `There are some undefined tags in organization ${org.name} (IDs: ${undefinedTags.join(", ")}). Omitting these tags.`,
        );
      }
      await orgModel.related("tags").attach(tagNames);
    }
    const newOrgId = await fixSequence("student_organizations");
    task.update(`Organizations created, next ID set to ${newOrgId}`);
    task.update("Creating links...");
    await StudentOrganizationLink.createMany(
      links.data
        .filter((link) => link.scientific_circle_id !== null)
        .map((link) => {
          const url = link.link.includes(":")
            ? link.link
            : `https://${link.link}`;
          return {
            id: link.id,
            link: url,
            linkType: this.detectLinkType(url),
            studentOrganizationId: link.scientific_circle_id,
          } as StudentOrganizationLink;
        }),
    );
    const newLinkId = await fixSequence("student_organization_links");
    task.update(`Links created, next ID set to ${newLinkId}`);
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
        return OrganizationType.ScientificClub;
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
}
