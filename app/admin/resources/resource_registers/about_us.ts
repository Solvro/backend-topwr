import { HrefContext } from "adminjs";

import { linkTypeAutodetectSetUp } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "About Us",
  icon: "Users",
};

export const AboutUsBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: AboutUsGeneralLink,
      ...linkTypeAutodetectSetUp,
    },
    {
      forModel: AboutUsGeneral,
      addImageHandlingForProperties: ["coverPhotoKey"],
      additionalProperties: {
        id: {
          isVisible: false,
        },
        description: {
          type: "richtext",
        },
      },
      additionalOptions: {
        href: ({ h, resource }: HrefContext): string => {
          return h.showUrl(resource.decorate().id(), "1", undefined);
        },
      },
      additionalActions: {
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
  ],
  navigation,
};
