class FileServiceError extends Error {
  constructor(message: string, stack: string | undefined) {
    super(message);
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

export class FileServiceFileDeleteError extends FileServiceError {
  constructor(message: string, stack: string | undefined) {
    super(message, stack);
    this.name = "FileServiceFileDeleteError";
  }
}
