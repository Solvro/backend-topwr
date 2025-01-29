import { LucidResource } from "@adminjs/adonis";

import { linkTypeEnumsValues } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const aboutUsResource = {
  resource: new LucidResource(AboutUsGeneral, "postgres"),
  options: {
    properties: {
      id: {
        isVisible: false,
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

export const aboutUsLinkResource = {
  resource: new LucidResource(AboutUsGeneralLink, "postgres"),
  options: {
    properties: {
      linkType: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};
