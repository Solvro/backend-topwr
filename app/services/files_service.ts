import nodePath from "node:path";
import { Readable } from "node:stream";

import { MultipartFile } from "@adonisjs/core/types/bodyparser";
import drive from "@adonisjs/drive/services/main";
import db from "@adonisjs/lucid/services/db";

import {
  FileServiceFileDiskDeleteError,
  FileServiceFileMetadataDeleteError,
  FileServiceFilePersistError,
  FileServiceFileUploadError,
} from "#exceptions/file_service_errors";
import FileEntry from "#models/file_entry";

// Notes on the file storage system:
// - files are currently saved on disk, under the `storage/` directory
//   - this may be changed to use some external file storage service in the future
// - files are renamed to randomly generated UUID4s, with the file extension kept
// - file metadata is saved in the database, which also enforces uniqueness constraints
// - files are immutable: file contents may not be changed after upload
//   - making files mutable would increase complexity related to caching
//   - the mobile client currently caches files by URL/key for 1 month

export default class FilesService {
  /**
   * Uploads a multipart file to storage.
   *
   * Use this if you're handling an API request and received a `MultipartFile` from adonis
   * @param file - The file to upload
   * @returns File entry representing the uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
  static async uploadMultipartFile(file: MultipartFile): Promise<FileEntry> {
    const fileEntry = FileEntry.createNew(file.extname);
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
        await file.moveToDisk(fileEntry.keyWithExtension);
        return fileEntry;
      } catch (error) {
        throw new FileServiceFileUploadError(error as Error);
      }
    });
  }

  /**
   * Uploads any readable stream to storage.
   *
   * Use this if you can get a readable stream from another API, such as `fetch()`.
   * Calling this function with a stream probably will be more efficient than reading the stream and using `uploadFromMemory()`.
   * @param stream - Stream with file contents to upload
   * @param extname - File's extension. Defaults to `.bin`.
   * @returns File entry representing the uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
  static async uploadStream(
    stream: Readable,
    extname: string | undefined = undefined,
  ): Promise<FileEntry> {
    const fileEntry = FileEntry.createNew(extname);
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
        await drive.use().putStream(fileEntry.keyWithExtension, stream);
        return fileEntry;
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
   * @returns File entry representing the uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
  static async uploadFromMemory(
    data: string | Uint8Array,
    extname: string | undefined = undefined,
  ): Promise<FileEntry> {
    const fileEntry = FileEntry.createNew(extname);
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
        await drive.use().put(fileEntry.keyWithExtension, data);
        return fileEntry;
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
   * @returns File entry representing the uploaded file
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause prop for details.
   */
  static async uploadLocalFile(
    path: string,
    removeSourceFile = false,
  ): Promise<FileEntry> {
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
        return fileEntry;
      } catch (error) {
        throw new FileServiceFileUploadError(error as Error);
      }
    });
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
    return await FilesService.deleteFileByEntry(fetchedEntity);
  }

  /**
   * Deletes a file from storage
   *
   * @param entry - File entry representing the file to be deleted
   * @return - true if delete is successful, false if no file to delete, throws if error occurs
   * @throws {FileServiceFileDiskDeleteError} There was an issue deleting the file. Check the cause prop for details.
   */
  static async deleteFileByEntry(entry: FileEntry): Promise<boolean> {
    return await db.transaction(async (trx) => {
      try {
        await entry.useTransaction(trx).delete();
      } catch (error) {
        throw new FileServiceFileMetadataDeleteError(error as Error);
      }
      try {
        await drive.use().delete(entry.keyWithExtension);
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
