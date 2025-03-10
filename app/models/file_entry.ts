import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import type { UUID } from "node:crypto";

import { BaseModel, column } from "@adonisjs/lucid/orm";

export default class FileEntry extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID;

  @column({ columnName: "file_extension" })
  declare fileExtension: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  get keyWithExtension() {
    return `${this.id}.${this.fileExtension}`;
  }

  public static createNew(extname: string | undefined): FileEntry {
    const fileEntry = new FileEntry();
    fileEntry.id = randomUUID();
    fileEntry.fileExtension =
      extname !== undefined && extname.length > 0 ? extname : "bin";
    return fileEntry;
  }

  public static async fetchKeyWithExtension(
    key: string,
  ): Promise<string | null> {
    return FileEntry.query()
      .select("file_extension")
      .where("id", key)
      .first()
      .then((value) =>
        value !== null ? `${key}.${value.fileExtension}` : null,
      );
  }
}
