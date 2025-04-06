import vine from "@vinejs/vine";

import { LinkType } from "#enums/link_type";

export const departmentValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    addressLine1: vine.string().trim().minLength(1),
    addressLine2: vine.string().trim().optional(),
    code: vine.string().trim().minLength(1),
    betterCode: vine.string().trim().minLength(1),
    logo: vine.string().trim().optional(),
    description: vine.string().trim().optional(),
    gradientStart: vine.string().trim().minLength(1),
    gradientStop: vine.string().trim().minLength(1),
  }),
);

export const departmentLinkValidator = vine.compile(
  vine.object({
    departmentId: vine.number().min(1).withoutDecimals(),
    linkType: vine.enum(LinkType),
    link: vine.string().trim().minLength(1),
  }),
);

export const fieldsOfStudyValidator = vine.compile(
  vine.object({
    departmentId: vine.number().min(1).withoutDecimals(),
    name: vine.string().trim().minLength(1),
    url: vine.string().trim().optional(),
    semesterCount: vine.number().min(1).withoutDecimals(),
    isEnglish: vine.boolean(),
    is2ndDegree: vine.boolean(),
    hasWeekendOption: vine.boolean(),
  }),
);
