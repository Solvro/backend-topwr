import vine from "@vinejs/vine";

import { BuildingIcon } from "#enums/building_icon";
import { Weekday } from "#enums/weekday";

export const buildingValidator = vine.compile(
  vine.object({
    identifier: vine.string().minLength(1).trim(),
    specialName: vine.string().optional(),
    iconType: vine.enum(BuildingIcon),
    campusId: vine.number().withoutDecimals().min(0),
    addressLine1: vine.string().minLength(1).trim(),
    addressLine2: vine.string().optional(),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    haveFood: vine.boolean(),
    cover: vine.string().optional(),
    externalDigitalGuideMode: vine.string().optional(),
    externalDigitalGuideIdOrURL: vine.string().optional(),
  }),
);

export const campusValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).trim(),
    cover: vine.string().optional(),
  }),
);

export const aedValidator = vine.compile(
  vine.object({
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    addressLine1: vine.string().optional(),
    addressLine2: vine.string().optional(),
    photoUrl: vine.string().optional(),
    buildingId: vine.number().optional(),
  }),
);

export const bicycleShowerValidator = vine.compile(
  vine.object({
    room: vine.string().optional(),
    instructions: vine.string().optional(),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    addressLine1: vine.string().optional(),
    addressLine2: vine.string().optional(),
    photoUrl: vine.string().optional(),
    buildingId: vine.number().optional(),
  }),
);

export const foodSpotValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).trim(),
    addressLine1: vine.string().optional(),
    addressLine2: vine.string().optional(),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    photoUrl: vine.string().optional(),
    buildingId: vine.number().optional(),
  }),
);

export const libraryValidator = vine.compile(
  vine.object({
    title: vine.string().minLength(1).trim(),
    room: vine.string().optional(),
    addressLine1: vine.string().optional(),
    addressLine2: vine.string().optional(),
    phone: vine.string().optional(),
    email: vine.string().optional(),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    photoUrl: vine.string().optional(),
    buildingId: vine.number().optional(),
  }),
);

export const regularHourValidator = vine.compile(
  vine.object({
    weekDay: vine.enum(Weekday),
    openTime: vine.string().minLength(1).trim(),
    closeTime: vine.string().minLength(1).trim(),
    libraryId: vine.number().min(0).withoutDecimals(),
  }),
);

export const specialHourValidator = vine.compile(
  vine.object({
    specialDate: vine.date(),
    openTime: vine.string().minLength(1).trim(),
    closeTime: vine.string().minLength(1).trim(),
    libraryId: vine.number().min(0).withoutDecimals(),
  }),
);
