import { BaseError } from "@solvro/error-handling/base";
import { FirebaseAppError } from "firebase-admin/app";
import { FirebaseMessagingError } from "firebase-admin/messaging";

export class PushNotificationError extends BaseError {
  constructor(cause: FirebaseMessagingError) {
    super("Failed to send push notification", {
      code: "E_PUSH_NOTIFICATION_ERROR",
      cause: cause.message,
      extraErrorFields: {
        fbCode: cause.code,
      },
    });
  }
}

export class FirebaseInitializationError extends BaseError {
  constructor(cause: FirebaseAppError) {
    super("Couldn't initialize Firebase app", {
      code: "E_FIREBASE_INITIALIZATION_ERROR",
      cause: cause.message,
      extraErrorFields: {
        fbCode: cause.code,
      },
    });
  }
}
