import sharp, { ResizeOptions, TimeoutOptions } from "sharp";

import { MultipartFile } from "@adonisjs/core/types/bodyparser";

import env from "#start/env";

const resizeOptions: ResizeOptions = {
  height: env.get("MINIATURE_MAX_HEIGHT_PX"),
  fit: "inside",
  withoutEnlargement: true,
};

const timeoutOptions: TimeoutOptions = {
  seconds: env.get("MINIATURE_MAX_PROCESSING_TIME_S"),
}; // Prevents infinite waits

export async function resizeFromPathOrBytes(
  dataOrPath: string | Uint8Array,
): Promise<Uint8Array> {
  const buffer = await sharp(dataOrPath)
    .resize(resizeOptions)
    .timeout(timeoutOptions)
    .toBuffer();
  return new Uint8Array(buffer);
}

export async function resizeFromMultipart(
  file: MultipartFile,
): Promise<Uint8Array> {
  if (file.tmpPath === undefined) {
    throw new Error("Invalid file provided");
  }
  return resizeFromPathOrBytes(file.tmpPath);
}
