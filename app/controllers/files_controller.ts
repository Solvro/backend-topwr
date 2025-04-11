import vine from "@vinejs/vine";

import type { HttpContext } from "@adonisjs/core/http";

import { BadRequestException } from "#exceptions/http_exceptions";
import FileEntry from "#models/file_entry";
import FilesService from "#services/files_service";

const getValidator = vine.compile(
  vine.object({
    params: vine.object({
      key: vine
        .string()
        .regex(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}(?:\..+)?$/),
    }),
  }),
);

export default class FilesController {
  async post({ request, response, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }

    const file = request.file("file");
    if (file === null) {
      throw new BadRequestException("No file provided");
    }

    const entry = await FilesService.uploadMultipartFile(file);

    return response.status(201).send({ key: entry.keyWithExtension });
  }

  async get({ request }: HttpContext) {
    const {
      params: { key },
    } = await request.validateUsing(getValidator);
    const file = await FileEntry.findOrFail(
      FilesService.trimKey(key),
    ).addErrorContext(() => `File with key '${key}' does not exist`);
    return file;
  }
}
