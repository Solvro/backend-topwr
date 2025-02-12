import { randomUUID } from "node:crypto";
import nodePath from "node:path";
import { Readable } from "node:stream";

import { MultipartFile } from "@adonisjs/core/types/bodyparser";
import drive from "@adonisjs/drive/services/main";

import {
  FileServiceFileDeleteError,
  FileServiceFileReadError,
  FileServiceFileUploadError,
} from "#exceptions/file_service_errors";

export default class FilesService {
  private generateKey(extname: string | undefined): string {
    if (extname?.length === 0) {
      extname = undefined;
    }
    return `${randomUUID()}.${extname ?? "bin"}`;
  }

  // Uploads a multipart file to storage (uploaded via API)
  async uploadMultipartFile(file: MultipartFile): Promise<string> {
    const key = this.generateKey(file.extname);
    try {
      await file.moveToDisk(key);
      return key;
    } catch (error) {
      throw new FileServiceFileUploadError(error as Error);
    }
  }

  // Uploads any readable stream, such as Response.body
  async uploadStream(
    stream: Readable,
    extname: string | undefined = undefined,
  ): Promise<string> {
    const key = this.generateKey(extname);
    try {
      await drive.use().putStream(key, stream);
      return key;
    } catch (error) {
      throw new FileServiceFileUploadError(error as Error);
    }
  }

  // Uploads a file with arbitrary contents
  async uploadFromMemory(
    data: string | Uint8Array,
    extname: string | undefined = undefined,
  ): Promise<string> {
    const key = this.generateKey(extname);
    try {
      await drive.use().put(key, data);
      return key;
    } catch (error) {
      throw new FileServiceFileUploadError(error as Error);
    }
  }

  // Uploads a file from the local filesystem
  // Pass removeSourceFile = true to remove the original file
  // If the path is not absolute, it will be resolved as a path relative to PWD (which should be the project root)
  async uploadLocalFile(
    path: string,
    removeSourceFile = false,
  ): Promise<string> {
    path = nodePath.resolve(path);
    const key = this.generateKey(nodePath.extname(path).substring(1));
    try {
      if (removeSourceFile) {
        await drive.use().moveFromFs(path, key);
      } else {
        await drive.use().copyFromFs(path, key);
      }
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
