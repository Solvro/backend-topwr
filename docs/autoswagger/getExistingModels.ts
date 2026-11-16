import fs from "node:fs";

import app from "@adonisjs/core/services/app";

export async function getExistingModels() {
  const modelPath = app.makePath("app/models");

  const modelFiles = await fs
    .readdirSync(modelPath)
    .filter((file) => file.endsWith(".ts"));

  const models: any[] = [];

  for (const file of modelFiles) {
    const modelName = file.replace(".ts", "");

    const modelModule = await import(`#models/${modelName}`);

    if (modelModule.default) {
      models.push(modelModule.default);
    }
  }

  return models;
}
