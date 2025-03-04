import { Exception } from "@adonisjs/core/exceptions";

export default class UnathorizedException extends Exception {
  static status = 401;
}
