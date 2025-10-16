import { BaseError } from "@solvro/error-handling/base";

import { DriveType, MINIATURES_DRIVE } from "#config/drive";

class FileServiceError extends BaseError {}

class FileServiceFSError extends FileServiceError {
  constructor(message: string, cause: unknown, driveType: DriveType) {
    super(`${driveType}: ${message}`, {
      code: "E_FILE_SYSTEM_ERROR",
      cause,
      extraResponseFields: {
        driveType,
      },
    });
  }
}

class FileServiceDBError extends FileServiceError {
  constructor(message: string, cause: unknown) {
    super(message, {
      code: "E_DATABASE_ERROR",
      cause,
    });
  }
}

export class FileServiceFileUploadError extends FileServiceFSError {
  constructor(driveType: DriveType, cause: Error) {
    super("Couldn't upload the file", cause, driveType);
  }
}

export class FileServiceUploadMiniatureConversionError extends FileServiceFSError {
  constructor(cause: Error) {
    super(
      "Failed to compute a miniature for the file",
      cause,
      MINIATURES_DRIVE,
    );
  }
}

export class FileServiceFilePersistError extends FileServiceDBError {
  constructor(cause: Error) {
    super("Couldn't save file metadata", cause);
  }
}

export class FileServiceFileDiskDeleteError extends FileServiceFSError {
  constructor(driveType: DriveType, cause: Error) {
    super("Couldn't delete the file from disk", cause, driveType);
  }
}

export class FileServiceFileMetadataDeleteError extends FileServiceDBError {
  constructor(cause: Error) {
    super("Couldn't delete the file metadata", cause);
  }
}
