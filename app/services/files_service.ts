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

  /**
   * Uploads a multipart file to storage.
   *
   * Use this if you're handling an API request and received a `MultipartFile` from adonis
   * @param file - The file to upload
   * @returns Key of the newly uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
  async uploadMultipartFile(file: MultipartFile): Promise<string> {
    const key = this.generateKey(file.extname);
    try {
      await file.moveToDisk(key);
      return key;
    } catch (error) {
      throw new FileServiceFileUploadError(error as Error);
    }
  }

  /**
   * Uploads any readable stream to storage.
   *
   * Use this if you can get a readable stream from another API, such as `fetch()`.
   * Calling this function with a stream probably will be more efficient than reading the stream and using `uploadFromMemory()`.
   * @param stream - Stream with file contents to upload
   * @param extname - File's extension. Defaults to `.bin`.
   * @returns Key of the newly uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
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

  /**
   * Uploads a file with arbitrary contents
   *
   * Use this function only if you cannot easily use other `upload*` functions.
   * @param data - File contents
   * @param extname - File's extension. Defaults to `.bin`.
   * @returns Key of the newly uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
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

  /**
   * Uploads a file from the local filesystem
   *
   * @param path - Path to file. Relative paths are resolved relative to `$PWD` (usually the project root)
   * @param removeSourceFile - Whether the file should be removed after upload.
   * @returns Key of the newly uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
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

  /**
   * Constructs a full file URL from its key
   *
   * @param key - File's key
   * @returns The full URL to the file
   * @throws {FileServiceFileReadError} There was an issue constructing the URL. Check the cause prop for details.
   */
  async getFileUrl(key: string): Promise<string> {
    // Get file URL from storage
    try {
      return await drive.use().getUrl(key);
    } catch (error) {
      throw new FileServiceFileReadError(error as Error);
    }
  }

  /**
   * Deletes a file from storage
   *
   * @param key - File's key
   * @throws {FileServiceFileDeleteError} There was an issue deleting the file. Check the cause prop for details.
   */
  async deleteFile(key: string): Promise<void> {
    // Delete file from storage
    try {
      await drive.use().delete(key);
    } catch (error) {
      throw new FileServiceFileDeleteError(error as Error);
    }
  }
}
