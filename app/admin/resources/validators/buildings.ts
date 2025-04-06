import vine from "@vinejs/vine";

import { BuildingIcon } from "#enums/building_icon";
import { Weekday } from "#enums/weekday";

export const buildingValidator = vine.compile(
  vine.object({
    identifier: vine.string().trim().minLength(1),
    specialName: vine.string().trim().optional(),
    iconType: vine.enum(BuildingIcon),
    campusId: vine.number().withoutDecimals().min(0),
    addressLine1: vine.string().trim().minLength(1),
    addressLine2: vine.string().optional(),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    haveFood: vine.boolean(),
    cover: vine.string().trim().optional(),
    externalDigitalGuideMode: vine.string().trim().optional(),
    externalDigitalGuideIdOrURL: vine.string().trim().optional(),
  }),
);

export const campusValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    cover: vine.string().trim().optional(),
  }),
);

export const aedValidator = vine.compile(
  vine.object({
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    addressLine1: vine.string().trim().optional(),
    addressLine2: vine.string().trim().optional(),
    photoUrl: vine.string().trim().optional(),
    buildingId: vine.number().optional(),
  }),
);

export const bicycleShowerValidator = vine.compile(
  vine.object({
    room: vine.string().optional(),
    instructions: vine.string().trim().optional(),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    addressLine1: vine.string().trim().optional(),
    addressLine2: vine.string().trim().optional(),
    photoUrl: vine.string().trim().optional(),
    buildingId: vine.number().optional(),
  }),
);

export const foodSpotValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    addressLine1: vine.string().trim().optional(),
    addressLine2: vine.string().trim().optional(),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    photoUrl: vine.string().trim().optional(),
    buildingId: vine.number().optional(),
  }),
);

export const libraryValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    room: vine.string().trim().optional(),
    addressLine1: vine.string().trim().optional(),
    addressLine2: vine.string().trim().optional(),
    phone: vine.string().trim().optional(),
    email: vine.string().trim().optional(),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    photoUrl: vine.string().trim().optional(),
    buildingId: vine.number().optional(),
  }),
);

export const regularHourValidator = vine.compile(
  vine.object({
    weekDay: vine.enum(Weekday),
    openTime: vine.string().trim().minLength(1),
    closeTime: vine.string().trim().minLength(1),
    libraryId: vine.number().min(0).withoutDecimals(),
  }),
);

export const specialHourValidator = vine.compile(
  vine.object({
    specialDate: vine.date(),
    openTime: vine.string().trim().minLength(1),
    closeTime: vine.string().trim().minLength(1),
    libraryId: vine.number().min(0).withoutDecimals(),
  }),
);
