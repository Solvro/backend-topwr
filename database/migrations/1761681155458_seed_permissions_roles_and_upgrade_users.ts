import { Acl } from "@holoyan/adonisjs-permissions";

import { BaseSchema } from "@adonisjs/lucid/schema";

import User from "#models/user";

export default class extends BaseSchema {
  async up() {
    this.defer(async () => {
      // Seed permissions (matching app/permissions/permissions.ts)
      await Acl.permission().create({ slug: "create" });
      await Acl.permission().create({ slug: "update" });
      await Acl.permission().create({ slug: "read" });
      await Acl.permission().create({ slug: "destroy" });
      await Acl.permission().create({ slug: "approve_draft" });
      await Acl.permission().create({ slug: "suggest_new" });
      await Acl.permission().create({ slug: "suggest_edit" });

      // Seed roles
      await Acl.role().create({ slug: "admin" });
      await Acl.role().create({ slug: "solvro_admin" });

      // Upgrade all existing users to solvro_admin
      const users = await User.all();
      for (const user of users) {
        await Acl.model(user).assignRole("solvro_admin");
      }
    });
  }

  async down() {
    this.defer(async () => {
      // Remove roles from all users first
      const users = await User.all();
      for (const user of users) {
        await Acl.model(user).flushRoles();
      }

      // Delete roles and permissions via Acl (recommended by docs)
      await Acl.role().delete("solvro_admin");
      await Acl.role().delete("admin");
      await Acl.permission().delete("suggest_new");
      await Acl.permission().delete("suggest_edit");
      await Acl.permission().delete("approve_draft");
      await Acl.permission().delete("destroy");
      await Acl.permission().delete("read");
      await Acl.permission().delete("update");
      await Acl.permission().delete("create");
    });
  }
}
