import vine from "@vinejs/vine";

import { LinkType } from "#enums/link_type";

export const departmentValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).trim(),
    addressLine1: vine.string().minLength(1).trim(),
    addressLine2: vine.string().optional(),
    code: vine.string().minLength(1).trim(),
    betterCode: vine.string().minLength(1).trim(),
    logo: vine.string().optional(),
    description: vine.string().optional(),
    gradientStart: vine.string().minLength(1).trim(),
    gradientStop: vine.string().minLength(1).trim(),
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
    name: vine.string().minLength(1).trim(),
    url: vine.string().optional(),
    semesterCount: vine.number().min(1).withoutDecimals(),
    isEnglish: vine.boolean(),
    is2ndDegree: vine.boolean(),
    hasWeekendOption: vine.boolean(),
  }),
);
