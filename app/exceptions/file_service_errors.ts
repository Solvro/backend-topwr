export class FileServiceFileUploadError extends Error {
  constructor(message: string, stack: string | undefined) {
    super(message);
    this.name = "FileServiceFileUploadError";
    this.stack = stack;
  }
}

export class FileServiceFileReadError extends Error {
  constructor(message: string, stack: string | undefined) {
    super(message);
    this.name = "FileServiceFileReadError";
    this.stack = stack;
  }
}
