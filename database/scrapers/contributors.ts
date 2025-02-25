import { DateTime } from "luxon";
import assert from "node:assert";
import { Readable } from "node:stream";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import { ChangeType } from "#enums/change_type";
import { LinkType } from "#enums/link_type";
import Contributor from "#models/contributor";
import Milestone from "#models/milestone";
import Role from "#models/role";
import Version from "#models/version";
import FilesService from "#services/files_service";
import { zip } from "#utils/arrays";

interface DirectusResponse<T> {
  data: T[];
}

interface DirectusCommon {
  id: number;
  date_created: string;
  date_updated: string | null;
}

type TeamVersions = DirectusCommon & {
  name: string;
};

type TeamVersionMembers = DirectusCommon & {
  name: string;
  subtitle: string;
  photo: string | null;
  appVersion: number;
  socialLinks: number[];
};

interface AboutUsTeam {
  id: number;
  name: string;
  subtitle: string;
  photo: string | null;
  socialLinks: number[];
}

interface AboutUsTeamSocialLinks {
  id: number;
  url: string;
}

interface TeamVersionMembersAboutUsTeamSocialLinks {
  id: number;
  TeamVersion_Members_id: number;
  AboutUs_Team_Social_Links_id: number;
}

type Changelog = DirectusCommon & {
  status: string;
  versionString: string;
  changes: number[];
  screenshots: number[];
};

type ChangelogChange = DirectusCommon & {
  changeDescription: string;
  changeType: string;
};

type ChangelogScreenshots = DirectusCommon & {
  screenshot_preview: string;
};

interface ContributorDraft {
  name: string;
  roles: Map<number, number[]>;
  links: Set<string>;
  photo: string | null;
  createdAt: DateTime | null;
  updatedAt: DateTime | null;
}

export default class ContributorsScraper extends BaseScraperModule {
  static name = "Contributors schema";
  static description = "Versions, milestones, changes, team members...";
  static taskTitle = "Scrape the contributors schema";

  private readonly directusSchemas = [
    "TeamVersions",
    "TeamVersion_Members",
    "AboutUs_Team",
    "AboutUs_Team_Social_Links",
    "TeamVersion_Members_AboutUs_Team_Social_Links",
    "Changelog",
    "Changelog_Change",
    "Changelog_Screenshots",
  ];

  private filesService = new FilesService();

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

  async run(task: TaskHandle) {
    task.update("Fetching all schema objects");
    const [
      directusMilestones,
      directusMilestoneMembers,
      directusTeam,
      directusTeamLinks,
      directusMilestoneMemberLinksPivot,
      directusVersions,
      directusChanges,
      directusScreenshots,
    ] = (await Promise.all(
      this.directusSchemas.map((schema) =>
        this.semaphore.runTask(() =>
          this.fetchJSON(
            `https://admin.topwr.solvro.pl/items/${schema}`,
            schema,
          ),
        ),
      ),
    )) as [
      DirectusResponse<TeamVersions>,
      DirectusResponse<TeamVersionMembers>,
      DirectusResponse<AboutUsTeam>,
      DirectusResponse<AboutUsTeamSocialLinks>,
      DirectusResponse<TeamVersionMembersAboutUsTeamSocialLinks>,
      DirectusResponse<Changelog>,
      DirectusResponse<ChangelogChange>,
      DirectusResponse<ChangelogScreenshots>,
    ];

    task.update("Migrating images");
    const imageIds = new Set([
      ...directusTeam.data.flatMap((member) => member.photo ?? []),
      ...directusMilestoneMembers.data.flatMap((member) => member.photo ?? []),
      ...directusScreenshots.data.flatMap(
        (screenshot) => screenshot.screenshot_preview,
      ),
    ]);

    const imageMap = new Map(
      await Promise.all(
        Array.from(imageIds).map((id) =>
          this.semaphore.runTask(async () => {
            const details = (await this.fetchJSON(
              `https://admin.topwr.solvro.pl/files/${id}?fields=filename_disk`,
              `details for file ${id}`,
            )) as { data: { filename_disk: string } };
            const extension = details.data.filename_disk
              .split(".")
              .pop()
              ?.toLowerCase();
            const fileResponse = await this.fetchAndCheckStatus(
              `https://admin.topwr.solvro.pl/assets/${id}`,
              `file ${id}`,
            );
            if (fileResponse.body === null) {
              throw new Error(`Response for file ${id} has no body, wtf`);
            }
            try {
              return [
                id,
                await this.filesService.uploadStream(
                  Readable.fromWeb(fileResponse.body),
                  extension,
                ),
              ] as [string, string];
            } catch (e) {
              throw new Error(`Failed to upload file ${id} to storage`, {
                cause: e,
              });
            }
          }),
        ),
      ),
    );

    task.update(`${imageMap.size} images migrated`);
    task.update("Creating contributor roles");
    const roleSet = Array.from(
      new Set(
        [
          ...directusMilestoneMembers.data.map((member) =>
            member.subtitle.split("|").map((role) => role.trim()),
          ),
          ...directusTeam.data.map((member) =>
            member.subtitle.split("|").map((role) => role.trim()),
          ),
        ].flat(),
      ),
    );

    const rolesMap = new Map(
      await Role.createMany(roleSet.map((role) => ({ name: role }))).then((r) =>
        r.map((role) => [role.name, role]),
      ),
    );

    task.update(`${rolesMap.size} roles created`);
    task.update("Creating milestones");
    const milestones = await Milestone.createMany(
      directusMilestones.data.map((milestone) => ({
        name: milestone.name,
        createdAt: DateTime.fromISO(milestone.date_created),
        updatedAt: DateTime.fromISO(
          milestone.date_updated ?? milestone.date_created,
        ),
      })),
    );
    const milestonesByDirectusId = new Map(
      zip(milestones, directusMilestones.data).map(([milestone, data]) => [
        data.id,
        milestone,
      ]),
    );
    const milestonesByName = new Map(milestones.map((m) => [m.name, m]));
    task.update(`${milestonesByDirectusId.size} milestones created`);
    task.update("Migrating contributors");

    const contributorLinks = new Map(
      directusTeamLinks.data.map((link) => [link.id, link.url]),
    );
    const contributorDrafts = new Map<string, ContributorDraft>();
    for (const contributor of directusTeam.data) {
      const draft = contributorDrafts.get(contributor.name) ?? {
        name: contributor.name,
        roles: new Map(),
        links: new Set(),
        photo: null,
        createdAt: null,
        updatedAt: null,
      };
      // use the latest photo
      draft.photo = contributor.photo ?? draft.photo;
      for (const linkId of contributor.socialLinks) {
        const link = contributorLinks.get(linkId);
        if (link === undefined) {
          this.logger.warning(
            `About us team member ${contributor.name} has a link ID ${linkId} attached, but such link does not exist!`,
          );
          continue;
        }
        draft.links.add(link);
      }
      contributorDrafts.set(draft.name, draft);
    }
    for (const contributor of directusMilestoneMembers.data) {
      const draft = contributorDrafts.get(contributor.name) ?? {
        name: contributor.name,
        roles: new Map<number, number[]>(),
        links: new Set(),
        photo: null,
        createdAt: null,
        updatedAt: null,
      };
      // use the latest photo
      draft.photo = contributor.photo ?? draft.photo;
      // parse dates
      const createdAt = DateTime.fromISO(contributor.date_created);
      const updatedAt = DateTime.fromISO(
        contributor.date_updated ?? contributor.date_created,
      );
      // set if null
      draft.createdAt ??= createdAt;
      draft.updatedAt ??= updatedAt;
      // or if saved created is newer, or if saved updated is older
      if (draft.createdAt > createdAt) {
        draft.createdAt = createdAt;
      }
      if (draft.updatedAt < updatedAt) {
        draft.updatedAt = updatedAt;
      }
      // extract links from the pivot object
      for (const pivot of directusMilestoneMemberLinksPivot.data) {
        if (pivot.TeamVersion_Members_id !== contributor.id) {
          continue;
        }
        const link = contributorLinks.get(pivot.AboutUs_Team_Social_Links_id);
        if (link === undefined) {
          this.logger.warning(
            `Version member ${contributor.name} (version ID ${contributor.appVersion}) has a link ID ${pivot.AboutUs_Team_Social_Links_id} attached, but such link does not exist!`,
          );
          continue;
        }
        draft.links.add(link);
      }
      // extract roles
      const contributorRoles = draft.roles.get(contributor.appVersion) ?? [];
      for (const roleName of contributor.subtitle
        .split("|")
        .map((r) => r.trim())) {
        const role = rolesMap.get(roleName);
        assert(role !== undefined); // we should've already detected this role and inserted it into the DB
        contributorRoles.push(role.id);
      }
      draft.roles.set(contributor.appVersion, contributorRoles);
      contributorDrafts.set(draft.name, draft);
    }
    // map photos to new keys
    for (const draft of contributorDrafts.values()) {
      if (draft.photo === null) {
        continue;
      }
      const newPhoto = imageMap.get(draft.photo);
      if (newPhoto === undefined) {
        this.logger.warning(
          `Failed to map ${draft.name}'s photo (${draft.photo}) to a new key!`,
        );
        draft.photo = null;
        continue;
      }
      draft.photo = newPhoto;
    }

    // create all contributors
    const contributors = await Contributor.createMany(
      Array.from(contributorDrafts.values()).map((draft) => ({
        name: draft.name,
        photoKey: draft.photo,
        createdAt: draft.createdAt ?? DateTime.now(),
        updatedAt: draft.updatedAt ?? DateTime.now(),
      })),
    );

    // assign roles and links
    for (const contributor of contributors) {
      const draft = contributorDrafts.get(contributor.name);
      if (draft === undefined) {
        this.logger.warning(
          `Contributor object ${contributor.name} has no corresponding draft object. This is either an adonis moment, or I screwed up badly`,
        );
        continue;
      }

      // links
      await contributor.related("socialLinks").createMany(
        Array.from(draft.links.values()).map((link) => ({
          link,
          linkType: this.detectLinkType(link),
        })),
      );

      // roles
      const rolesRelation = contributor.related("roles");
      for (const [versionId, roles] of draft.roles.entries()) {
        const milestone = milestonesByDirectusId.get(versionId);
        if (milestone === undefined) {
          this.logger.warning(
            `Contributor ${contributor.name} has roles in the app version ID ${versionId}, but no such version appears to exist`,
          );
          continue;
        }
        const toAttach: Record<number, { milestone_id: number }> = {};
        for (const roleId of roles) {
          toAttach[roleId] = {
            milestone_id: milestone.id,
          };
        }
        await rolesRelation.attach(toAttach);
      }
    }

    task.update(`${contributors.length} contributors migrated.`);
    task.update("Migrating changelogs");
    const latestMilestone = milestones.at(-1);
    const versions = await Version.createMany(
      directusVersions.data.map((version) => {
        const milestone =
          milestonesByName.get(version.versionString) ?? latestMilestone;
        if (milestone === undefined) {
          throw new Error(
            "There are no milestones defined, can't migrate versions",
          );
        }
        const updateDate = DateTime.fromISO(
          version.date_updated ?? version.date_created,
        );
        return {
          milestoneId: milestone.id,
          name: version.versionString,
          createdAt: DateTime.fromISO(version.date_created),
          updatedAt: updateDate,
          releaseDate: version.status === "published" ? updateDate : null,
        };
      }),
    );
    const directusChangesById = new Map(
      directusChanges.data.map((change) => [change.id, change]),
    );
    const directusScreenshotsById = new Map(
      directusScreenshots.data.map((screenshot) => [screenshot.id, screenshot]),
    );
    await Promise.all(
      zip(versions, directusVersions.data).map(async ([version, data]) => {
        // for each version, migrate changes
        await version.related("changes").createMany(
          data.changes.flatMap((changeId) => {
            const change = directusChangesById.get(changeId);
            if (change === undefined) {
              this.logger.warning(
                `Version '${version.name}' has change ID '${changeId}', but no such change appears to exist`,
              );
              return [];
            }
            let type;
            if (change.changeType === "fix") {
              type = ChangeType.Fix;
            } else if (change.changeType === "feature") {
              type = ChangeType.Feature;
            } else {
              this.logger.warning(
                `Version '${version.name}'s change ID '${changeId}' has an unknown change type '${change.changeType}'`,
              );
              return [];
            }
            return {
              type,
              name: change.changeDescription,
              createdAt: DateTime.fromISO(change.date_created),
              updatedAt: DateTime.fromISO(
                change.date_updated ?? change.date_created,
              ),
            };
          }),
        );

        // and for each version, migrate screenshots
        await version.related("screenshots").createMany(
          data.screenshots.flatMap((screenshotId) => {
            const screenshot = directusScreenshotsById.get(screenshotId);
            if (screenshot === undefined) {
              this.logger.warning(
                `Version '${version.name}' has screenshot ID '${screenshotId}', but no such screenshot appears to exist`,
              );
              return [];
            }
            const fileKey = imageMap.get(screenshot.screenshot_preview);
            if (fileKey === undefined) {
              this.logger.warning(
                `Version '${version.name}'s screenshot ID '${screenshotId}' has file '${screenshot.screenshot_preview}' attached, but no such file appears to exist`,
              );
              return [];
            }
            return {
              imageKey: fileKey,
              createdAt: DateTime.fromISO(screenshot.date_created),
              updatedAt: DateTime.fromISO(
                screenshot.date_updated ?? screenshot.date_created,
              ),
            };
          }),
        );
      }),
    );
    task.update(`${versions.length} versions migrated`);
  }
}
