import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import {
  BaseMessage,
  ConditionMessage,
  TopicMessage,
  getMessaging,
} from "firebase-admin/messaging";

import logger from "@adonisjs/core/services/logger";

export interface PushNotificationData {
  title: string;
  body: string;
  data: Record<string, string>;
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
      logger.error("Failed to initialize Firebase app. Error: ", error);
      throw error;
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
      const fbError = error as { code: string; message: string };
      logger.warn(
        `Failed to send the notification. Code: ${fbError.code}. Error: ${fbError.message}`,
      );
      throw error;
    }
  }
}
