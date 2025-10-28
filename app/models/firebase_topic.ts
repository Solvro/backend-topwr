import { DateTime } from "luxon";

import { BaseModel } from "@adonisjs/lucid/orm";
import db from "@adonisjs/lucid/services/db";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

export interface TopicState {
  activeTopics: string[];
  deactivatedTopics: string[];
}

export default class FirebaseTopic extends BaseModel {
  // Overall, updating the topic or removing it can lead to sync errors between us and the mobile application
  // Thus a created topic cannot be deleted or have its name changed - only deactivation is permitted

  @typedColumn({ isPrimary: true, type: "string" })
  declare topicName: string;

  @typedColumn({ type: "boolean", hasDefault: true })
  declare isActive: boolean;

  // Notes when a topic was deactivated - if the topic is active, this field is empty
  @typedColumn.dateTime({ optional: true, autoCreate: true, autoUpdate: true }) // autoCreate/Update as in managed
  declare deactivatedAt: DateTime | null;

  @typedColumn({ optional: true, type: "string" })
  declare description: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  /**
   * Use this method to manipulate the topic state instead of manually field updates
   * Note: This method does not change the database state
   */
  public deactivateTopic() {
    this.isActive = false;
    this.deactivatedAt = DateTime.now();
  }

  /**
   * Use this method to manipulate the topic state instead of manually field updates
   * Note: This method does not change the database state
   */
  public activateTopic() {
    this.isActive = true;
    this.deactivatedAt = null;
  }

  /**
   * Get the list of all active topics and the list of all topics that are deactivated and their
   * deactivation has taken place in the timeframe from the given date till now
   * @param deactivatedSince cutoff for the deactivation date - if the topic was deactivated before this date, it will not be returned
   * @returns {TopicState} object with the current state of the topics
   */
  public static async getTopicState(
    deactivatedSince: DateTime,
  ): Promise<TopicState> {
    const result = await db.rawQuery<{
      rows: TopicState[];
    }>("SELECT * FROM get_fb_topic_state(?)", [deactivatedSince.toSQL()], {
      mode: "read",
    });
    return result.rows[0];
  }

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
