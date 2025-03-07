import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import FilesService from "#services/files_service";

export default class FilesController {
  @inject()
  async post({ request, response }: HttpContext) {
    const file = request.file("file");
    if (file === null) {
      return response.badRequest("No file provided");
    }

    const key = await FilesService.uploadMultipartFile(file);

    return response.status(201).send({ key });
  }

  @inject()
  async get({ params, response }: HttpContext) {
    const { key } = params;
    if (typeof key !== "string") {
      return response.badRequest("Invalid key. Expected a string.");
    }
    const url = await FilesService.getFileUrl(key);

    return response.status(200).send({ url });
  }
}
