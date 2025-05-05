import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected oldName = "departments_links";
  protected newName = "department_links";

  async up() {
    // adonis is weird and will make changes in dry mode if you await
    void this.schema.renameTable(this.oldName, this.newName);
  }

  async down() {
    void this.schema.renameTable(this.newName, this.oldName);
  }
}
