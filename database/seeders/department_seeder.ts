import { BaseSeeder } from "@adonisjs/lucid/seeders";

import Department from "#models/department";

export default class extends BaseSeeder {
  static environment = ["development", "testing"];
  async run() {
    await Department.create({
      name: "Department 1",
      addressLine1: "123 University Ave",
      code: "123",
      betterCode: "123",
      gradientStart: "red",
      gradientStop: "blue",
    });
  }
}
