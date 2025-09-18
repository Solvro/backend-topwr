import vine from "@vinejs/vine";

import type { HttpContext, Request } from "@adonisjs/core/http";
import drive from "@adonisjs/drive/services/main";

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

const directUploadValidator = vine.compile(
  vine.object({
    // why is there no .notStartsWith :sob:
    // this regex basically enforces that the extension must not start/end with . and there may not be more than 1 . in a row
    ext: vine.string().regex(/^[a-z\d]+(?:\.[a-z\d]+)*$/i),
  }),
);

export default class FilesController {
  async post({ request, response, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }

    let entry: FileEntry;
    if (request.request.readable) {
      entry = await this.directUpload(request);
    } else {
      entry = await this.formUpload(request);
    }

    // ensure we didn't just write an empty file
    let metadata;
    try {
      metadata = await drive
        .use()
        .getMetaData(entry.keyWithExtension)
        .addErrorContext("Failed to verify newly uploaded file");
    } catch (e) {
      // try to delete the file, though we don't care about failures
      try {
        await FilesService.deleteFileByEntry(entry);
      } catch {}
      throw e;
    }
    if (metadata.contentLength <= 0) {
      // delete the empty file
      try {
        await FilesService.deleteFileByEntry(entry);
      } catch {}
      throw new BadRequestException("Attempted to upload empty file");
    }

    return response.status(201).send({ key: entry.keyWithExtension });
  }

  private async formUpload(request: Request): Promise<FileEntry> {
    const file = request.file("file");
    if (file === null) {
      throw new BadRequestException(
        "No file provided (form upload expected based on Content-Type)",
      );
    }
    return await FilesService.uploadMultipartFile(file);
  }

  private async directUpload(request: Request): Promise<FileEntry> {
    // not using vine as I don't want it to accidentally parse the request body
    const { ext } = await directUploadValidator.validate(request.qs());
    return await FilesService.uploadStream(request.request, ext);
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
