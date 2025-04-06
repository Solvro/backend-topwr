import { LucidResource } from "@adminjs/adonis";
import { ActionRequest } from "adminjs";

import { changeTypeEnumsValues } from "#enums/change_type";
import { linkTypeEnumsValues } from "#enums/link_type";
import Change from "#models/change";
import ChangeScreenshot from "#models/change_screenshot";
import Contributor from "#models/contributor";
import ContributorSocialLink from "#models/contributor_social_link";
import Milestone from "#models/milestone";
import Role from "#models/role";
import Version from "#models/version";
import VersionScreenshot from "#models/version_screenshot";

import { readOnlyTimestamps } from "./utils/timestamps.js";
import { validateResource } from "./validators/utils.js";
import {
  changeScreenshotValidator,
  changesValidator,
  contributorSocialLinksValidator,
  contributorValidator,
  milestoneValidator,
  roleValidator,
  versionScreenshotValidator,
  versionValidator,
} from "./validators/versions.js";

const navigation = {
  name: "Versions",
  icon: "GitBranch",
};

const changeResource = {
  resource: new LucidResource(Change, "postgres"),
  options: {
    navigation,
    properties: {
      type: changeTypeEnumsValues,
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(changesValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(changesValidator, request),
      },
    },
  },
};

const changeScreenshotResource = {
  resource: new LucidResource(ChangeScreenshot, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(changeScreenshotValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(changeScreenshotValidator, request),
      },
    },
  },
};

const contributorResource = {
  resource: new LucidResource(Contributor, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(contributorValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(contributorValidator, request),
      },
    },
  },
};

const contributorSocialLinksResource = {
  resource: new LucidResource(ContributorSocialLink, "postgres"),
  options: {
    navigation,
    properties: {
      linkType: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(contributorSocialLinksValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(contributorSocialLinksValidator, request),
      },
    },
  },
};

const milestoneResource = {
  resource: new LucidResource(Milestone, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(milestoneValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(milestoneValidator, request),
      },
    },
  },
};

const roleResource = {
  resource: new LucidResource(Role, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(roleValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(roleValidator, request),
      },
    },
  },
};

const versionResource = {
  resource: new LucidResource(Version, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(versionValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(versionValidator, request),
      },
    },
  },
};

const versionScreenshotResource = {
  resource: new LucidResource(VersionScreenshot, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(versionScreenshotValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(versionScreenshotValidator, request),
      },
    },
  },
};

export const versionsResources = [
  changeResource,
  changeScreenshotResource,
  contributorResource,
  contributorSocialLinksResource,
  milestoneResource,
  roleResource,
  versionResource,
  versionScreenshotResource,
];
