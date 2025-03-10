class FileServiceError extends Error {
  constructor(message: string, cause: Error) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}

export class FileServiceFileUploadError extends FileServiceError {
  constructor(cause: Error) {
    super("Couldn't upload the file", cause);
  }
}

export class FileServiceFilePersistError extends FileServiceError {
  constructor(cause: Error) {
    super("Couldn't save file metadata", cause);
  }
}

export class FileServiceFileReadError extends FileServiceError {
  constructor(cause: Error) {
    super("Could't read the file", cause);
  }
}

export class FileServiceFileDiskDeleteError extends FileServiceError {
  constructor(cause: Error) {
    super("Couldn't delete the file from disk", cause);
  }
}

export class FileServiceFileMetadataDeleteError extends FileServiceError {
  constructor(cause: Error) {
    super("Couldn't delete the file metadata", cause);
  }
}
