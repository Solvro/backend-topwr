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
import db from "@adonisjs/lucid/services/db";

import {
  FirebaseInitializationError,
  PushNotificationError,
} from "#exceptions/push_notification_service_errors";
import PushNotificationEntry, {
  PushNotificationData,
} from "#models/push_notification_entry";

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
    let wasSent = true;
    try {
      await getMessaging().send(message);
      logger.info(`Sent push notification ${data.title}`);
    } catch (error) {
      wasSent = false;
      throw new PushNotificationError(error as FirebaseMessagingError);
    } finally {
      // Save the notification
      await this.saveNotification(data, wasSent, topicNames);
    }
  }

  private static async saveNotification(
    data: PushNotificationData,
    wasSent: boolean,
    topicNames: string[],
  ) {
    const entry = PushNotificationEntry.fromData(data, wasSent);
    try {
      await db.transaction(async (trx) => {
        await entry.useTransaction(trx).save();
        await entry.useTransaction(trx).related("topics").attach(topicNames);
      });
    } catch (error) {
      // Saving is not a priority - failure to do so is different from the failure to send the notification
      logger.warn(`Failed to save push notification ${data.title}: ${error}`);
    }
  }
}
