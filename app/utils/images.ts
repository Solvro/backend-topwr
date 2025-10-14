import { MultipartFile } from "@adonisjs/core/types/bodyparser";

export async function resizeFromBytes(
  data: string | Uint8Array,
): Promise<Uint8Array> {}

export async function resizeFromPath(path: string): Promise<Uint8Array> {}

export async function resizeFromMultipart(
  file: MultipartFile,
): Promise<Uint8Array> {}
