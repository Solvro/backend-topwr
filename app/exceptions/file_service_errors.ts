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

export class FileServiceFileReadError extends FileServiceError {
  constructor(cause: Error) {
    super("Could't read the file", cause);
  }
}

export class FileServiceFileDeleteError extends FileServiceError {
  constructor(cause: Error) {
    super("Couldn't delete the file", cause);
  }
}
