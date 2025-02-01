class FileServiceError extends Error {
  constructor(message: string, stack: string | undefined) {
    super(message);
    this.name = "FileServiceFileUploadError";
    this.stack = stack;
  }
}

export class FileServiceFileUploadError extends FileServiceError {
  constructor(message: string, stack: string | undefined) {
    super(message, stack);
    this.name = "FileServiceFileUploadError";
  }
}

export class FileServiceFileReadError extends FileServiceError {
  constructor(message: string, stack: string | undefined) {
    super(message, stack);
    this.name = "FileServiceFileReadError";
  }
}
