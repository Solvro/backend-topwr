import nodePath from "node:path";
import { Readable } from "node:stream";

import { MultipartFile } from "@adonisjs/core/types/bodyparser";
import drive from "@adonisjs/drive/services/main";
import db from "@adonisjs/lucid/services/db";

import {
  FileServiceFileDiskDeleteError,
  FileServiceFileMetadataDeleteError,
  FileServiceFilePersistError,
  FileServiceFileReadError,
  FileServiceFileUploadError,
} from "#exceptions/file_service_errors";
import FileEntry from "#models/file_entry";

export default class FilesService {
  private static getExtension(extname: string | undefined): string {
    return extname !== undefined && extname.length > 0 ? extname : "bin";
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
    const fileEntry = FileEntry.createNew(file.extname);
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
        await file.moveToDisk(fileEntry.keyWithExtension);
        return fileEntry.keyWithExtension;
      } catch (error) {
        throw new FileServiceFileUploadError(error as Error);
      }
    });
  }

  /**
   * Replaces a multipart file in storage.
   *
   * Use this if you're handling an API request and received a `MultipartFile` from adonis
   * @param file - The file to upload
   * @param existingFileKey - the key of file you wish to replace, preferably without the extension name
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
  static async replaceWithMultipartFile(
    file: MultipartFile,
    existingFileKey: string,
  ): Promise<string> {
    existingFileKey = this.trimKey(existingFileKey);
    const fileEntry = await FileEntry.find(existingFileKey);
    if (fileEntry === null) {
      throw new FileServiceFileUploadError(
        Error("File does not exist. Use uploadMultipartFile method instead."),
      );
    }
    try {
      await drive.use().delete(fileEntry.keyWithExtension);
    } catch (error) {
      throw new FileServiceFileDiskDeleteError(error as Error);
    }
    const newExtension = this.getExtension(file.extname);
    if (newExtension !== fileEntry.fileExtension) {
      return await db.transaction(async (trx) => {
        fileEntry.fileExtension = newExtension;
        try {
          await fileEntry.useTransaction(trx).save();
        } catch (error) {
          throw new FileServiceFilePersistError(error as Error);
        }
        try {
          await file.moveToDisk(fileEntry.keyWithExtension);
        } catch (error) {
          throw new FileServiceFileUploadError(error as Error);
        }
        return fileEntry.keyWithExtension;
      });
    }
    try {
      await file.moveToDisk(fileEntry.keyWithExtension);
    } catch (error) {
      throw new FileServiceFileMetadataDeleteError(error as Error);
    }
    return fileEntry.keyWithExtension;
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
    const fileEntry = FileEntry.createNew(extname);
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
        await drive.use().putStream(fileEntry.keyWithExtension, stream);
        return fileEntry.keyWithExtension;
      } catch (error) {
        throw new FileServiceFileUploadError(error as Error);
      }
    });
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
    const fileEntry = FileEntry.createNew(extname);
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
        await drive.use().put(fileEntry.keyWithExtension, data);
        return fileEntry.keyWithExtension;
      } catch (error) {
        throw new FileServiceFileUploadError(error as Error);
      }
    });
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
    const fileEntry = FileEntry.createNew(nodePath.extname(path).substring(1));
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
        const key = fileEntry.keyWithExtension;
        if (removeSourceFile) {
          await drive.use().moveFromFs(path, key);
        } else {
          await drive.use().copyFromFs(path, key);
        }
        return key;
      } catch (error) {
        throw new FileServiceFileUploadError(error as Error);
      }
    });
  }

  /**
   * Constructs a full file URL from its key
   *
   * @param key - File's key, preferably without extension
   * @returns The full URL to the file
   * @throws {FileServiceFileReadError} There was an issue constructing the URL. Check the cause prop for details.
   */
  static async getFileUrl(key: string): Promise<string | null> {
    key = this.trimKey(key);
    try {
      const keyWithExtension = await FileEntry.fetchKeyWithExtension(key);
      if (keyWithExtension !== null) {
        return await drive.use().getUrl(keyWithExtension);
      }
      return null;
    } catch (error) {
      throw new FileServiceFileReadError(error as Error);
    }
  }

  /**
   * Deletes a file from storage
   *
   * @param key - File's key, preferably without extension
   * @return - true if delete is successful, false if no file to delete, throws if error occurs
   * @throws {FileServiceFileDiskDeleteError} There was an issue deleting the file. Check the cause prop for details.
   */
  static async deleteFileWithKey(key: string): Promise<boolean> {
    key = this.trimKey(key);
    const fetchedEntity = await FileEntry.find(key);
    if (fetchedEntity === null) {
      return false;
    }
    return await db.transaction(async (trx) => {
      try {
        await fetchedEntity.useTransaction(trx).delete();
      } catch (error) {
        throw new FileServiceFileMetadataDeleteError(error as Error);
      }
      try {
        await drive.use().delete(fetchedEntity.keyWithExtension);
      } catch (error) {
        throw new FileServiceFileDiskDeleteError(error as Error);
      }
      return true;
    });
  }

  static trimKey(keyToTrim: string): string {
    const lastIndex = keyToTrim.lastIndexOf(".");
    return lastIndex > 0 ? keyToTrim.substring(0, lastIndex) : keyToTrim;
  }
}
