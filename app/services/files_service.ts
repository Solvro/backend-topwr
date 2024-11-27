import { MultipartFile } from '@adonisjs/core/types/bodyparser'
import drive from '@adonisjs/drive/services/main'
import { randomUUID } from 'node:crypto'

export default class FilesService {
  async uploadFile(file: MultipartFile) {
    // Upload file to storage
    const key = `${randomUUID()}.${file.extname}`
    try {
      await file.moveToDisk(key)
      return key
    } catch (error) {
      return error
    }
  }

  async getFileUrl(key: string) {
    // Get file URL from storage
    try {
      const url = await drive.use().getUrl(key)
      return url
    } catch (error) {
      return error
    }
  }
  async deleteFile(key: string) {
    // Delete file from storage
    try {
      await drive.use().delete(key)
    } catch (error) {
      return error
    }
  }
}
