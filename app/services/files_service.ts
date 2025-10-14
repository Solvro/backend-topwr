import nodePath from "node:path";
import { Readable } from "node:stream";

import logger from "@adonisjs/core/services/logger";
import { MultipartFile } from "@adonisjs/core/types/bodyparser";
import { Disk } from "@adonisjs/drive";
import drive from "@adonisjs/drive/services/main";
import db from "@adonisjs/lucid/services/db";

import { MAIN_DRIVE, MINIATURES_DRIVE } from "#config/drive";
import {
  FileServiceFileDiskDeleteError,
  FileServiceFileMetadataDeleteError,
  FileServiceFilePersistError,
  FileServiceFileUploadError,
  FileServiceUploadMiniatureConversionError,
} from "#exceptions/file_service_errors";
import FileEntry from "#models/file_entry";
import { resizeFromMultipart, resizeFromPathOrBytes } from "#utils/images";

function getMainDrive(): Disk {
  return drive.use(MAIN_DRIVE);
}

function getMiniaturesDrive(): Disk {
  return drive.use(MINIATURES_DRIVE);
}

/** Notes on the file storage system:
 * - files are currently saved on disk, under the `storage/` directory
 *  - this may be changed to use some external file storage service in the future
 * - for every photo-like file a miniature is generated, saved under the `storage/miniatures/` directory*
 *  - the lifetime of a miniature is managed by the lifetime of the original file - removing the original removes the miniature
 * - files are renamed to randomly generated UUID4s, with the file extension kept
 * - file metadata is saved in the database, which also enforces uniqueness constraints
 * - files are immutable: file contents may not be changed after upload
 *  - making files mutable would increase complexity related to caching
 *  - the mobile client currently caches files by URL/key for 1 month
 */
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
      const miniatureSaved = await this.uploadMiniatureIfApplicableOrFail(
        () => resizeFromMultipart(file),
        fileEntry,
      );
      try {
        await file.moveToDisk(fileEntry.keyWithExtension);
        return fileEntry;
      } catch (error) {
        if (miniatureSaved) {
          await this.removeMiniatureSilently(fileEntry.keyWithExtension);
        }
        throw new FileServiceFileUploadError(MAIN_DRIVE, error as Error);
      }
    });
  }

  /**
   * Uploads any readable stream to storage. Calling with a photo-like file is equivalent to calling the `uploadFromMemory()` entrypoint.
   *
   * Use this if you can get a readable stream from another API, such as `fetch()`.
   * Calling this function with a stream probably will be more efficient than reading the stream and using `uploadFromMemory()`.
   * If the file uploaded is a photo, the stream advantage is negated as it is converted to a buffer anyway.
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
    if (fileEntry.isPhoto()) {
      // To compute the miniature, we need the entire content
      const rawData = await stream.toArray();
      const data = new Uint8Array(rawData);
      return this.uploadFromMemoryInternal(data, fileEntry);
    }
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      try {
        await getMainDrive().putStream(fileEntry.keyWithExtension, stream);
        return fileEntry;
      } catch (error) {
        throw new FileServiceFileUploadError(MAIN_DRIVE, error as Error);
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
    data: Uint8Array,
    extname: string | undefined = undefined,
  ): Promise<FileEntry> {
    const fileEntry = FileEntry.createNew(extname);
    return this.uploadFromMemoryInternal(data, fileEntry);
  }

  private static async uploadFromMemoryInternal(
    data: Uint8Array,
    fileEntry: FileEntry,
  ): Promise<FileEntry> {
    return await db.transaction(async (trx) => {
      try {
        await fileEntry.useTransaction(trx).save();
      } catch (error) {
        throw new FileServiceFilePersistError(error as Error);
      }
      const miniatureSaved = await this.uploadMiniatureIfApplicableOrFail(
        () => resizeFromPathOrBytes(data),
        fileEntry,
      );
      const key = fileEntry.keyWithExtension;
      try {
        await getMainDrive().put(key, data);
        return fileEntry;
      } catch (error) {
        if (miniatureSaved) {
          await this.removeMiniatureSilently(key);
        }
        throw new FileServiceFileUploadError(MAIN_DRIVE, error as Error);
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
      const miniatureSaved = await this.uploadMiniatureIfApplicableOrFail(
        () => resizeFromPathOrBytes(path),
        fileEntry,
      );
      try {
        const key = fileEntry.keyWithExtension;
        if (removeSourceFile) {
          await getMainDrive().moveFromFs(path, key);
        } else {
          await getMainDrive().copyFromFs(path, key);
        }
        if (miniatureSaved) {
          await this.removeMiniatureSilently(key);
        }
      } catch (error) {
        throw new FileServiceFileUploadError(MAIN_DRIVE, error as Error);
      }
      return fileEntry;
    });
  }

  /**
   * If the file is not photo-like, exists instantly with False value. Otherwise, computes the miniature and saves it to the miniatures drive.
   *
   * @param miniatureGenerator - Lazily called function that would return the miniature. If the file is not photo-like, this function will never called.
   * @param fileEntry - File entry object representing the original file
   * @returns Boolean indicating whether the miniature was saved or not. True means it was saved successfully; False means the file was not photo-like.
   * @throws {FileServiceFileUploadError} There was an issue uploading the file. Check the cause property for details.
   * @throws {FileServiceUploadMiniatureConversionError} The generator function threw an error. Check the cause property for details.
   */
  private static async uploadMiniatureIfApplicableOrFail(
    miniatureGenerator: () => Promise<Uint8Array>,
    fileEntry: FileEntry,
  ): Promise<boolean> {
    if (fileEntry.isPhoto()) {
      let resized;
      try {
        resized = await miniatureGenerator();
      } catch (error) {
        throw new FileServiceUploadMiniatureConversionError(error as Error);
      }
      try {
        await getMiniaturesDrive().put(fileEntry.keyWithExtension, resized);
        return true;
      } catch (error) {
        throw new FileServiceFileUploadError(MINIATURES_DRIVE, error as Error);
      }
    }
    return false;
  }

  private static async removeMiniatureSilently(key: string) {
    try {
      await getMiniaturesDrive().delete(key);
    } catch (error) {
      // Log but do not rethrow
      logger.error(`Failed to delete the miniature ${key}`, error);
    }
  }

  /**
   * Deletes a file from storage. If the file is photo-like, will delete the miniature as well.
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
   * Deletes a file from storage. If the file is photo-like, will delete the miniature as well.
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
      // Adonis uses FlyDrive, calling delete on a non-existent file does not throw - it passes silently. As such,
      // 'delete' calls throw only on failures
      const key = entry.keyWithExtension;
      if (entry.isPhoto()) {
        // If the entry is a photo, it should have a miniature computed.
        // Unless both the main file and miniature are deleted, the entry is not removed.
        // Since miniature can be recomputed it should be deleted first in case of an error
        try {
          await getMiniaturesDrive().delete(key);
        } catch (error) {
          throw new FileServiceFileDiskDeleteError(
            MINIATURES_DRIVE,
            error as Error,
          );
        }
      }
      try {
        await getMainDrive().delete(key);
      } catch (error) {
        throw new FileServiceFileDiskDeleteError(MAIN_DRIVE, error as Error);
      }
      return true;
    });
  }

  static trimKey(keyToTrim: string): string {
    const lastIndex = keyToTrim.lastIndexOf(".");
    return lastIndex > 0 ? keyToTrim.substring(0, lastIndex) : keyToTrim;
  }
}
