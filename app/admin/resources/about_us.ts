import { LucidResource } from "@adminjs/adonis";
import { ResourceWithOptions } from "adminjs";

import { linkTypeEnumsValues } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";

import { readOnlyTimestamps } from "./utils/timestamps.js";

const navigation = {
  name: "About Us",
  icon: "Users",
};

const aboutUsResource: ResourceWithOptions = {
  resource: new LucidResource(AboutUsGeneral, "postgres"),
  options: {
    href: ({ h, resource }) => {
      return h.showUrl(resource.decorate().id(), "1", undefined);
    },
    navigation,
    properties: {
      id: {
        isVisible: false,
      },
      description: {
        type: "richtext",
      },
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        isAccessible: false,
        isVisible: false,
      },
      delete: {
        isAccessible: false,
        isVisible: false,
      },
      bulkDelete: {
        isAccessible: false,
        isVisible: false,
      },
    },
  },
};

const aboutUsLinkResource = {
  resource: new LucidResource(AboutUsGeneralLink, "postgres"),
  options: {
    navigation,
    properties: {
      linkType: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

export const aboutUsResources = [aboutUsResource, aboutUsLinkResource];
