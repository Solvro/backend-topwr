import { randomUUID } from "node:crypto";

import { MultipartFile } from "@adonisjs/core/types/bodyparser";
import drive from "@adonisjs/drive/services/main";

export default class FilesService {
  async uploadFile(file: MultipartFile): Promise<string | Error> {
    // Upload file to storage
    const key = `${randomUUID()}.${file.extname}`;
    try {
      await file.moveToDisk(key);
      return key;
    } catch (error) {
      return error;
    }
  }

  async getFileUrl(key: string): Promise<string | Error> {
    // Get file URL from storage
    try {
      return await drive.use().getUrl(key);
    } catch (error) {
      return error;
    }
  }
  async deleteFile(key: string): Promise<void | Error> {
    // Delete file from storage
    try {
      await drive.use().delete(key);
    } catch (error) {
      return error;
    }
  }
}
