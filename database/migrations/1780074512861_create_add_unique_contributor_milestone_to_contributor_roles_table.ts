import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "contributor_roles";

  async up() {
    // Deduplicate before adding the constraint: keep one role per
    // (contributor_id, milestone_id) pair (the lowest role_id).
    this.schema.raw(`
      DELETE FROM contributor_roles cr
      USING contributor_roles keep
      WHERE cr.contributor_id = keep.contributor_id
        AND cr.milestone_id   = keep.milestone_id
        AND cr.role_id        > keep.role_id;
    `);

    // Enforce: a contributor can only have one role per milestone (version).
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(["contributor_id", "milestone_id"]);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(["contributor_id", "milestone_id"]);
    });
  }
}
