import nodePath from "node:path";
import { Readable } from "node:stream";

import { MultipartFile } from "@adonisjs/core/types/bodyparser";
import drive from "@adonisjs/drive/services/main";

import {
  FileServiceFileDeleteError,
  FileServiceFilePersistError,
  FileServiceFileReadError,
  FileServiceFileUploadError,
} from "#exceptions/file_service_errors";
import FileEntry from "#models/file_entry";

export default class FilesService {
  private static getExtension(extname: string | undefined): string {
    return extname !== undefined && extname.length > 0 ? extname : "bin";
  }

  private static mapToDiskKey(fileKey: string, fileType: string): string {
    return `${fileKey}.${fileType}`;
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
    const fileEntry = FileEntry.createFileEntry(file.extname);
    try {
      await fileEntry.save();
    } catch (error) {
      throw new FileServiceFilePersistError(error as Error);
    }
    try {
      const diskKey = fileEntry.diskKey;
      await file.moveToDisk(diskKey);
      return diskKey;
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
      throw new FileServiceFileUploadError(
        Error("File does not exist. Use uploadMultipartFile method instead."),
      );
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
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
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
    const fileEntry = FileEntry.createFileEntry(extname);
    try {
      await fileEntry.save();
    } catch (error) {
      throw new FileServiceFilePersistError(error as Error);
    }
    try {
      const diskKey = fileEntry.diskKey;
      await drive.use().putStream(diskKey, stream);
      return diskKey;
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
    const fileEntry = FileEntry.createFileEntry(extname);
    try {
      await fileEntry.save();
    } catch (error) {
      throw new FileServiceFilePersistError(error as Error);
    }
    try {
      const diskKey = fileEntry.diskKey;
      await drive.use().put(diskKey, data);
      return diskKey;
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
    const fileEntry = FileEntry.createFileEntry(
      nodePath.extname(path).substring(1),
    );
    try {
      await fileEntry.save();
    } catch (error) {
      throw new FileServiceFilePersistError(error as Error);
    }
    try {
      const diskKey = fileEntry.diskKey;
      if (removeSourceFile) {
        await drive.use().moveFromFs(path, diskKey);
      } else {
        await drive.use().copyFromFs(path, diskKey);
      }
      return diskKey;
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
    const fetchedEntity = await FileEntry.find(key);
    if (fetchedEntity !== null) {
      try {
        await fetchedEntity.delete();
        await drive.use().delete(fetchedEntity.diskKey);
        return true;
      } catch (error) {
        throw new FileServiceFileDeleteError(error as Error);
      }
    }
    return false;
  }

  static extractFileKeyFromDiskKey(diskKey: string): string {
    return diskKey.substring(0, diskKey.lastIndexOf("."));
  }
}
