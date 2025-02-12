import { randomUUID } from "node:crypto";

import { MultipartFile } from "@adonisjs/core/types/bodyparser";
import drive from "@adonisjs/drive/services/main";

import {
  FileServiceFileDeleteError,
  FileServiceFileReadError,
  FileServiceFileUploadError,
} from "#exceptions/file_service_errors";

export default class FilesService {
  async uploadFile(file: MultipartFile): Promise<string> {
    // Upload file to storage
    const key = `${randomUUID()}.${file.extname}`;
    try {
      await file.moveToDisk(key);
      return key;
    } catch (error) {
      throw new FileServiceFileUploadError(error as Error);
    }
  }

  async getFileUrl(key: string): Promise<string> {
    // Get file URL from storage
    try {
      return await drive.use().getUrl(key);
    } catch (error) {
      throw new FileServiceFileReadError(error as Error);
    }
  }
  async deleteFile(key: string): Promise<void> {
    // Delete file from storage
    try {
      await drive.use().delete(key);
    } catch (error) {
      throw new FileServiceFileDeleteError(error as Error);
    }
  }
}
