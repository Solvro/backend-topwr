import type { IsolationLevels } from "@adonisjs/lucid/types/database";

const transactionConfig = {
  isolationLevel: "repeatable read",
} satisfies { isolationLevel: IsolationLevels };

export default transactionConfig;
