import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'
import { randomUUID } from 'node:crypto'

export default class PhotosController {
  async post({ request, response }: HttpContext) {
    const file = request.file('file')
    const key = `${randomUUID()}.${file?.extname}`
    if (file) {
      await file.moveToDisk(key)
    } else {
      return response.badRequest('File is required')
    }
    return response.created({ key })
  }

  async get({ params, response }: HttpContext) {
    const { key } = params
    return response.status(200).send(await drive.use().getUrl(key))
  }
}
