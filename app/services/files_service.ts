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
import FileEntry from "#services/file_entry";

interface FileInformation {
  fileInstance: FileEntry;
  diskKey: string;
}
export default class FilesService {
  private static mapToFileInstance(extname: string | undefined): FileEntry {
    let fileType = "bin";
    if (extname !== undefined && extname.length > 0) {
      fileType = extname;
    }
    const fileEntry = new FileEntry();
    fileEntry.id = randomUUID();
    fileEntry.fileType = fileType;
    return fileEntry;
  }

  private static mapToDiskKey(fileInstance: FileEntry): string {
    return `${fileInstance.id}.${fileInstance.fileType}`;
  }

  private static createFileInformation(
    extname: string | undefined,
  ): FileInformation {
    const fileInstance = FilesService.mapToFileInstance(extname);
    return {
      fileInstance,
      diskKey: FilesService.mapToDiskKey(fileInstance),
    };
  }

  /**
   * Uploads a multipart file to storage.
   *
   * Use this if you're handling an API request and received a `MultipartFile` from adonis
   * @param file - The file to upload
   * @returns Key of the newly uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
  static async uploadMultipartFile(file: MultipartFile): Promise<string> {
    const fileInfo = FilesService.createFileInformation(file.extname);
    try {
      await fileInfo.fileInstance.save();
      await file.moveToDisk(fileInfo.diskKey);
      return fileInfo.diskKey;
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
  static async uploadStream(
    stream: Readable,
    extname: string | undefined = undefined,
  ): Promise<string> {
    const fileInfo = FilesService.createFileInformation(extname);
    try {
      await fileInfo.fileInstance.save();
      await drive.use().putStream(fileInfo.diskKey, stream);
      return fileInfo.diskKey;
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
  static async uploadFromMemory(
    data: string | Uint8Array,
    extname: string | undefined = undefined,
  ): Promise<string> {
    const fileInfo = FilesService.createFileInformation(extname);
    try {
      await fileInfo.fileInstance.save();
      await drive.use().put(fileInfo.diskKey, data);
      return fileInfo.diskKey;
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
  static async uploadLocalFile(
    path: string,
    removeSourceFile = false,
  ): Promise<string> {
    path = nodePath.resolve(path);
    const fileInfo = FilesService.createFileInformation(
      nodePath.extname(path).substring(1),
    );
    try {
      if (removeSourceFile) {
        await fileInfo.fileInstance.save();
        await drive.use().moveFromFs(path, fileInfo.diskKey);
      } else {
        await fileInfo.fileInstance.save();
        await drive.use().copyFromFs(path, fileInfo.diskKey);
      }
      return fileInfo.diskKey;
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
  static async getFileUrl(key: string): Promise<string> {
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
  static async deleteFile(key: string): Promise<void> {
    try {
      const recordExists = await FileEntry.deleteByKey(key);
      if (recordExists) {
        await drive.use().delete(key);
      }
    } catch (error) {
      throw new FileServiceFileDeleteError(error as Error);
    }
  }
}
