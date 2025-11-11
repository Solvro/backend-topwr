import {
  FirebaseAppError,
  applicationDefault,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import {
  BaseMessage,
  ConditionMessage,
  FirebaseMessagingError,
  TopicMessage,
  getMessaging,
} from "firebase-admin/messaging";

import logger from "@adonisjs/core/services/logger";

import {
  FirebaseInitializationError,
  PushNotificationError,
} from "#exceptions/push_notification_service_errors";

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string> | undefined;
}

export default class PushNotificationService {
  private static initFbOrFail() {
    try {
      if (getApps().length === 0) {
        // This only runs once if the initialisation is successful
        initializeApp({
          credential: applicationDefault(),
        });
        logger.info("Firebase app initialized.");
      }
    } catch (error) {
      throw new FirebaseInitializationError(error as FirebaseAppError);
    }
  }

  public static async sendPushNotification(
    data: PushNotificationData,
    topics: Set<string>,
  ) {
    if (topics.size === 0) {
      return;
    }
    // Init Firebase
    this.initFbOrFail();
    // Prepare message content
    const messageBase: BaseMessage = {
      notification: {
        title: data.title,
        body: data.body,
      },
      data: data.data,
    };
    // Prepare topics
    let message: TopicMessage | ConditionMessage;
    const topicNames = topics.values().toArray();
    if (topicNames.length === 1) {
      // One topic, send as TopicMessage
      message = {
        topic: topicNames[0],
        ...messageBase,
      };
    } else {
      // More than one topic, map to a ConditionMessage
      message = {
        condition: topicNames
          .map((topicName) => `'${topicName}' in topics`)
          .join(" || "),
        ...messageBase,
      };
    }
    // Send
    try {
      await getMessaging().send(message);
      logger.info(`Sent push notification ${data.title}`);
    } catch (error) {
      throw new PushNotificationError(error as FirebaseMessagingError);
    }
  }
}
