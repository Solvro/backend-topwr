import vine from "@vinejs/vine";

import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "#exceptions/http_exceptions";
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
  async post({ request, response }: HttpContext) {
    if (app.inProduction) {
      throw new ForbiddenException(
        "This endpoint is not available in production environments",
      );
    }
    const file = request.file("file");
    if (file === null) {
      throw new BadRequestException("No file provided");
    }

    const key = await FilesService.uploadMultipartFile(file);

    return response.status(201).send({ key });
  }

  async get({ request, response }: HttpContext) {
    const {
      params: { key },
    } = await request.validateUsing(getValidator);
    const url = await FilesService.getFileUrl(key);
    if (url === null) {
      throw new NotFoundException(`No file found with key ${key}`);
    }
    return response.status(200).send({ url });
  }
}
