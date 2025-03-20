import vine from "@vinejs/vine";

import { LinkType } from "#enums/link_type";

export const aboutUsGeneralValidator = vine.compile(
  vine.object({
    description: vine.string().trim().minLength(1),
    coverPhotoKey: vine.string().trim().minLength(1),
  }),
);

export const aboutUsGeneralLinkValidator = vine.compile(
  vine.object({
    linkType: vine.enum(LinkType),
    link: vine.string().trim().minLength(1),
  }),
);
