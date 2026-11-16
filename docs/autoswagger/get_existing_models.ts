import { readdir } from "node:fs/promises";

import app from "@adonisjs/core/services/app";
import type { LucidModel } from "@adonisjs/lucid/types/model";

export async function getExistingModels(): Promise<LucidModel[]> {
  const modelPath = app.makePath("app/models");

  const files = await readdir(modelPath);
  const modelFiles = files.filter(
    (file) => file.endsWith(".ts") && !file.endsWith(".d.ts"),
  );

  const models: LucidModel[] = [];

  for (const file of modelFiles) {
    const modelName = file.replace(".ts", "");

    const modelModule = (await import(`#models/${modelName}`)) as {
      default?: LucidModel;
    };

    if (modelModule.default !== undefined) {
      models.push(modelModule.default);
    }
  }

  return models;
}
