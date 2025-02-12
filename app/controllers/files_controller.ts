import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import FilesService from "#services/files_service";

export default class FilesController {
  @inject()
  async post({ request, response }: HttpContext, filesService: FilesService) {
    const file = request.file("file");
    if (file === null) {
      return response.badRequest("No file provided");
    }

    const key = await filesService.uploadFile(file);

    return response.status(201).send({ key });
  }

  @inject()
  async get({ params, response }: HttpContext, filesService: FilesService) {
    const { key } = params;
    if (typeof key !== "string") {
      return response.badRequest("Invalid key. Expected a string.");
    }
    const url = await filesService.getFileUrl(key);

    return response.status(200).send({ url });
  }
}
