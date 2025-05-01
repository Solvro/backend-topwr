import { RelationType } from "@adminjs/relations";

import { changeTypeEnumsValues } from "#enums/change_type";
import { linkTypeAutodetectSetUp } from "#enums/link_type";
import Change from "#models/change";
import ChangeScreenshot from "#models/change_screenshot";
import Contributor from "#models/contributor";
import ContributorSocialLink from "#models/contributor_social_link";
import Milestone from "#models/milestone";
import Role from "#models/role";
import Version from "#models/version";
import VersionScreenshot from "#models/version_screenshot";

import { ResourceBuilder, normalizeResourceName } from "../resource_factory.js";

const navigation = {
  name: "Versions",
  icon: "GitBranch",
};

export const VersionsBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: Change,
      additionalProperties: { type: changeTypeEnumsValues },
      ownedRelations: [
        {
          displayLabel: "Change screenshots",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(ChangeScreenshot),
              joinKey: ChangeScreenshot.getChangesRelationKey(),
            },
          },
        },
      ],
      isRelationTarget: true,
    },
    {
      forModel: ContributorSocialLink,
      ...linkTypeAutodetectSetUp,
      isRelationTarget: true,
    },
    {
      forModel: ChangeScreenshot,
      addImageHandlingForProperties: ["imageKey"],
      isRelationTarget: true,
    },
    {
      forModel: Contributor,
      addImageHandlingForProperties: ["photoKey"],
      isRelationTarget: true,
      ownedRelations: [
        {
          displayLabel: "Contributor social Links",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(ContributorSocialLink),
              joinKey: ContributorSocialLink.getContributorRelationKey(),
            },
          },
        },
      ],
    },
    {
      forModel: Milestone,
      ownedRelations: [
        {
          displayLabel: "Versions",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(Version),
              joinKey: Version.getMilestoneRelationKey(),
            },
          },
        },
        // {
        //   displayLabel: "Student Organization Tags",
        //   relation: {
        //     type: RelationType.ManyToMany,
        //     junction: {
        //       joinKey: StudentOrganization.getTagsJoinKey(),
        //       inverseJoinKey: StudentOrganizationTag.getStudentOrganizationInverseJoinKey(),
        //       throughResourceId: normalizeResourceName(StudentOrganization)
        //     },
        //     target: {
        //       resourceId: normalizeResourceName(StudentOrganizationTag),
        //     },
        //   },
        // },
      ],
    },
    {
      forModel: Role,
      // {
      //   displayLabel: "Student Organization Tags",
      //   relation: {
      //     type: RelationType.ManyToMany,
      //     junction: {
      //       joinKey: StudentOrganization.getTagsJoinKey(),
      //       inverseJoinKey: StudentOrganizationTag.getStudentOrganizationInverseJoinKey(),
      //       throughResourceId: normalizeResourceName(StudentOrganization)
      //     },
      //     target: {
      //       resourceId: normalizeResourceName(StudentOrganizationTag),
      //     },
      //   },
      // },
    },
    {
      forModel: Version,
      ownedRelations: [
        {
          displayLabel: "Changes",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(Change),
              joinKey: Change.getVersionRelationKey(),
            },
          },
        },
        {
          displayLabel: "Version screenshots",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(VersionScreenshot),
              joinKey: VersionScreenshot.getVersionRelationKey(),
            },
          },
        },
      ],
      isRelationTarget: true,
    },
    {
      forModel: VersionScreenshot,
      addImageHandlingForProperties: ["imageKey"],
      isRelationTarget: true,
    },
  ],
  navigation,
};
