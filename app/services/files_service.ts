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
  private static getExtension(extname: string | undefined): string {
    return extname !== undefined && extname.length > 0 ? extname : "bin";
  }

  private static mapToFileInstance(extname: string | undefined): FileEntry {
    const fileEntry = new FileEntry();
    fileEntry.id = randomUUID();
    fileEntry.fileType = this.getExtension(extname);
    return fileEntry;
  }

  private static mapInstanceToDiskKey(fileInstance: FileEntry): string {
    return `${fileInstance.id}.${fileInstance.fileType}`;
  }

  private static mapToDiskKey(fileKey: string, fileType: string): string {
    return `${fileKey}.${fileType}`;
  }

  private static createFileInformation(
    extname: string | undefined,
  ): FileInformation {
    const fileInstance = FilesService.mapToFileInstance(extname);
    return {
      fileInstance,
      diskKey: FilesService.mapInstanceToDiskKey(fileInstance),
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
   * Replaces a multipart file in storage.
   *
   * Use this if you're handling an API request and received a `MultipartFile` from adonis
   * @param file - The file to upload
   * @param existingFileKey - the key of file you wish to replace, without the extension name
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
  static async replaceWithMultipartFile(
    file: MultipartFile,
    existingFileKey: string,
  ): Promise<string> {
    const oldExtension = await FileEntry.getExtensionIfExists(existingFileKey);
    if (oldExtension === undefined) {
      throw new FileServiceFileUploadError(Error("File does not exist"));
    }
    const newExtension: string = this.getExtension(file.extname);
    const diskKey: string = this.mapToDiskKey(existingFileKey, newExtension);
    if (oldExtension === newExtension) {
      try {
        await file.moveToDisk(diskKey);
      } catch (error) {
        throw new FileServiceFileUploadError(error as Error);
      }
    } else {
      try {
        await FileEntry.updateFileType(newExtension, existingFileKey);
        await drive
          .use()
          .delete(this.mapToDiskKey(existingFileKey, oldExtension));
        await file.moveToDisk(diskKey);
      } catch (error) {
        throw new FileServiceFileUploadError(error as Error);
      }
    }
    return diskKey;
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
   * @param diskKey - File's full key from disk
   * @return - true if delete is successful, false if no file to delete, throws if error occurs
   * @throws {FileServiceFileDeleteError} There was an issue deleting the file. Check the cause prop for details.
   */
  static async deleteFileWithDiskKey(diskKey: string): Promise<boolean> {
    try {
      const recordExists = await FileEntry.deleteByKeyAndReturnResult(
        this.extractFileKeyFromDiskKey(diskKey),
      );
      if (recordExists) {
        await drive.use().delete(diskKey);
        return true;
      }
      return false;
    } catch (error) {
      throw new FileServiceFileDeleteError(error as Error);
    }
  }

  /**
   * Deletes a file from storage
   *
   * @param key - File's key without extension. If you have the full diskKey, it is better to use the deleteFileWithDiskKey method
   * @return - true if delete is successful, false if no file to delete, throws if error occurs
   * @throws {FileServiceFileDeleteError} There was an issue deleting the file. Check the cause prop for details.
   */
  static async deleteFileWithKey(key: string): Promise<boolean> {
    try {
      const extension = await FileEntry.getExtensionIfExists(key);
      if (extension !== undefined) {
        await FileEntry.deleteByKey(key);
        await drive.use().delete(this.mapToDiskKey(key, extension));
        return true;
      }
      return false;
    } catch (error) {
      throw new FileServiceFileDeleteError(error as Error);
    }
  }

  static extractFileKeyFromDiskKey(diskKey: string): string {
    return diskKey.substring(0, diskKey.lastIndexOf("."));
  }
}
