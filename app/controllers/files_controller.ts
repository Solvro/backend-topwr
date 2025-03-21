import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";

import FilesService from "#services/files_service";

export default class FilesController {
  async post({ request, response }: HttpContext) {
    if (app.inProduction) {
      return response.forbidden();
    }
    const file = request.file("file");
    if (file === null) {
      return response.badRequest("No file provided");
    }

    const key = await FilesService.uploadMultipartFile(file);

    return response.status(201).send({ key });
  }

  async get({ params, response }: HttpContext) {
    const { key } = params;
    if (
      typeof key !== "string" ||
      key.length <= 38 ||
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        key.substring(0, 36),
      )
    ) {
      return response.badRequest("Invalid key. Expected a valid UUID.");
    }
    const url = await FilesService.getFileUrl(key);
    if (url === null) {
      return response.notFound();
    }
    return response.status(200).send({ url });
  }
}
