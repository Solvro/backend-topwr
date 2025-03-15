import vine from "@vinejs/vine";

import { ChangeType } from "#enums/change_type";
import { LinkType } from "#enums/link_type";

export const changesValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    versionId: vine.number().min(0).withoutDecimals(),
    type: vine.enum(ChangeType),
    description: vine.string().trim().optional(),
  }),
);

export const changeScreenShotValidator = vine.compile(
  vine.object({
    changeId: vine.number().min(0).withoutDecimals(),
    imageKey: vine.string().trim().minLength(1),
    subtitle: vine.string().trim().optional(),
  }),
);

export const contributorValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    photoKey: vine.string().trim().optional(),
  }),
);

export const contributorSocialLinkValidator = vine.compile(
  vine.object({
    contributorId: vine.number().min(0).withoutDecimals(),
    linkType: vine.enum(LinkType),
    link: vine.string().trim().minLength(1),
  }),
);

export const milestoneValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
  }),
);

export const roleValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
  }),
);

export const versionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    milestoneId: vine.number().min(0).withoutDecimals(),
    releaseDate: vine.date().optional(),
    description: vine.string().trim().optional(),
  }),
);

export const versionScreenshotValidator = vine.compile(
  vine.object({
    versionId: vine.number().min(0).withoutDecimals(),
    imageKey: vine.string().trim().minLength(1),
    subtitle: vine.string().trim().optional(),
  }),
);
