import vine from "@vinejs/vine";

import { LinkType } from "#enums/link_type";

export const studentOrganizationValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    departmentId: vine.number().min(0).withoutDecimals(),
    logo: vine.string().trim().minLength(1).optional(),
    cover: vine.string().trim().minLength(1).optional(),
  }),
);

export const studentOrganizationLinkValidator = vine.compile(
  vine.object({
    studentOrganizationId: vine.number().min(0).withoutDecimals(),
    type: vine.enum(LinkType),
    link: vine.string().trim().minLength(1),
  }),
);

export const studentOrganizationTagValidator = vine.compile(
  vine.object({
    tag: vine.string().trim().minLength(1),
  }),
);
