import { Exception } from "@adonisjs/core/exceptions";

export default class NotImplementedException extends Exception {
  constructor(message?: string) {
    super(message, {
      status: 501,
      code: "E_NOT_IMPLEMENTED",
    });
  }
}
