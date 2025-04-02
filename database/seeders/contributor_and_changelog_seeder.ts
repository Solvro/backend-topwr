import { DateTime } from "luxon";

import { BaseSeeder } from "@adonisjs/lucid/seeders";

import { ChangeType } from "#enums/change_type";
import { LinkType } from "#enums/link_type";
import Contributor from "#models/contributor";
import Milestone from "#models/milestone";
import Role from "#models/role";
import Version from "#models/version";

export default class ContributorAndChangelogSeeder extends BaseSeeder {
  static environment = ["development", "testing"];

  async run() {
    const milestone = await Milestone.create({ name: "testing milestone" });

    await this.seedContributors(milestone);
    await this.seedChangelogs(milestone);
  }

  private async seedContributors(milestone: Milestone) {
    const roles = await Role.createMany([
      {
        name: "Backend Dev",
      },
      {
        name: "Frontend Dev",
      },
      {
        name: "Techlead",
      },
      {
        name: "Piwo Manager",
      },
    ]);

    const contributors = await Contributor.createMany([
      {
        name: "Aaaaa Aaaaaa",
        photoKey: null,
      },
      {
        name: "Bbbbb Bbbbbb",
        photoKey: null,
      },
      {
        name: "Aaaaa Bbbbb",
        photoKey: null,
      },
      {
        name: "Bbbbb Aaaaa",
        photoKey: null,
      },
    ]);
    const links = [
      {
        linkType: LinkType.Mail,
        link: "example@example.org",
      },
      {
        linkType: LinkType.X,
        link: "https://x.com/example",
      },
      {
        linkType: LinkType.GitHub,
        link: "https://github.com/example",
      },
      {
        linkType: LinkType.Twitch,
        link: "https://twitch.tv/example",
      },
    ];

    for (const [i, contributor] of contributors.entries()) {
      await contributor
        .related("roles")
        .attach({ [roles[i].id]: { milestone_id: milestone.id } });
      await contributor.related("socialLinks").create(links[i]);
    }
  }

  private async seedChangelogs(milestone: Milestone) {
    const template = [
      {
        version: {
          milestoneId: milestone.id,
          name: "v1.0.0",
          releaseDate: DateTime.now(),
          description: "some description",
        },
        screenshots: [
          // {
          //   imageKey: "image1",
          //   subtitle: "an image",
          // },
          // {
          //   imageKey: "image2",
          //   subtitle: null,
          // },
        ],
        changes: [
          {
            change: {
              type: ChangeType.Fix,
              name: "some fix1",
              description: null,
            },
            screenshots: [
              // {
              //   imageKey: "image3",
              //   subtitle: "another image",
              // },
              // {
              //   imageKey: "image4",
              //   subtitle: null,
              // },
            ],
          },
          {
            change: {
              type: ChangeType.Feature,
              name: "some feature1",
              description: "an epic feature numero one",
            },
            screenshots: [
              // {
              //   imageKey: "image5",
              //   subtitle: "epic feature image",
              // },
            ],
          },
        ],
      },
      {
        version: {
          milestoneId: milestone.id,
          name: "v1.0.1",
          releaseDate: null,
          description: null,
        },
        screenshots: [
          // {
          //   imageKey: "image6",
          //   subtitle: "yet another image",
          // },
        ],
        changes: [
          {
            change: {
              type: ChangeType.Fix,
              name: "some fix2",
              description: null,
            },
            screenshots: [],
          },
        ],
      },
    ];

    for (const versionTemplate of Object.values(template)) {
      const version = await Version.create(versionTemplate.version);
      await version
        .related("screenshots")
        .createMany(versionTemplate.screenshots);
      for (const changeTemplate of Object.values(versionTemplate.changes)) {
        const change = await version
          .related("changes")
          .create(changeTemplate.change);
        await change
          .related("screenshots")
          .createMany(changeTemplate.screenshots);
      }
    }
  }
}
