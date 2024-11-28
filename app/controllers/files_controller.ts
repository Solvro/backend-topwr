import type { HttpContext } from '@adonisjs/core/http'

import FilesService from '#services/files_service'
import { inject } from '@adonisjs/core'

export default class FilesController {
  @inject()
  async post({ request, response }: HttpContext, filesService: FilesService) {
    const file = request.file('file')
    if (!file) {
      return response.badRequest('No file provided')
    }
    const key = await filesService.uploadFile(file)
    if (key instanceof Error) {
      return response.badRequest(key.message)
    }
    return response.status(201).send({ key })
  }

  @inject()
  async get({ params, response }: HttpContext, filesService: FilesService) {
    const { key } = params
    const url = await filesService.getFileUrl(key)
    if (url instanceof Error) {
      return response.badRequest(url.message)
    }
    return response.status(200).send({ url })
  }
}
