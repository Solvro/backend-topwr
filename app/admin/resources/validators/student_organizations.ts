import vine from "@vinejs/vine";

import { LinkType } from "#enums/link_type";

export const studentOrganizationValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).trim(),
    departmentId: vine.number().min(0).withoutDecimals(),
    logo: vine.string().minLength(1).trim().optional(),
    cover: vine.string().minLength(1).trim().optional(),
  }),
);

export const studentOrganizationLinkValidator = vine.compile(
  vine.object({
    studentOrganizationId: vine.number().min(0).withoutDecimals(),
    type: vine.enum(LinkType),
    link: vine.string().minLength(1).trim(),
  }),
);

export const studentOrganizationTagValidator = vine.compile(
  vine.object({
    tag: vine.string().minLength(1).trim(),
  }),
);
