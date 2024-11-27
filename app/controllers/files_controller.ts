import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'

export default class PhotosController {
  async post({ request }: HttpContext) {
    const file = request.file('file')
    const key = `${new Date().getTime()}.${file?.extname}`
    if (file) {
      // await drive.use().put(key, file.tmpPath ?? '')
      await file.moveToDisk(key)
    }
    return key
  }

  async get({ params }: HttpContext) {
    const { key } = params
    return drive.use().getUrl(key)
  }
}
