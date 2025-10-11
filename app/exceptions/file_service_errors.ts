import { BaseError } from "@solvro/error-handling/base";

class FileServiceError extends BaseError {}

class FileServiceFSError extends FileServiceError {
  constructor(message: string, cause: unknown) {
    super(message, {
      code: "E_FILE_SYSTEM_ERROR",
      cause,
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
  constructor(cause: Error) {
    super("Couldn't upload the file", cause);
  }
}

export class FileServiceFilePersistError extends FileServiceDBError {
  constructor(cause: Error) {
    super("Couldn't save file metadata", cause);
  }
}

export class FileServiceFileDiskDeleteError extends FileServiceFSError {
  constructor(cause: Error) {
    super("Couldn't delete the file from disk", cause);
  }
}

export class FileServiceFileMetadataDeleteError extends FileServiceDBError {
  constructor(cause: Error) {
    super("Couldn't delete the file metadata", cause);
  }
}
