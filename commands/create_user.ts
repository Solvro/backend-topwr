import { Acl } from "@holoyan/adonisjs-permissions";

import { BaseCommand, args } from "@adonisjs/core/ace";
import { CommandOptions } from "@adonisjs/core/types/ace";

import User from "#models/user";

export default class CreateUser extends BaseCommand {
  static commandName = "create:user";
  static description = "Create a new user in the system";

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({
    argumentName: "email",
    description: "Email address of the user",
  })
  declare email: string;

  @args.string({
    argumentName: "password",
    description: "Password for the user",
  })
  declare password: string;

  async run() {
    this.logger.info(`Creating user: ${this.email}`);
    const availableRoles = await Acl.role().query().orderBy("slug");
    const roleChoices = new Map<string, string>();

    for (const role of availableRoles) {
      const { slug, title } = role;
      let label = slug;
      if (typeof title === "string" && title.trim().length > 0) {
        label = `${title} (${slug})`;
      }
      roleChoices.set(label, slug);
    }

    let selectedRoleSlug: string | null = null;
    if (roleChoices.size > 0) {
      const noneOption = "No role";
      const choice = await this.prompt.choice(
        "Select a role to assign",
        [...roleChoices.keys(), noneOption],
        { default: noneOption },
      );
      selectedRoleSlug = roleChoices.get(choice) ?? null;
    } else {
      this.logger.warning(
        "No roles found in the system. The user will be created without a role.",
      );
    }

    const user = await User.create({
      email: this.email,
      password: this.password,
    });

    if (selectedRoleSlug !== null) {
      await Acl.model(user).assignRole(selectedRoleSlug);
      this.logger.info(
        `Assigned role ${selectedRoleSlug} to user ${this.email}`,
      );
    }

    this.logger.success("User created successfully");
  }
}
