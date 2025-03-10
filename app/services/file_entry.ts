import { DateTime } from "luxon";
import type { UUID } from "node:crypto";

import { BaseModel, column } from "@adonisjs/lucid/orm";

export default class FileEntry extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID;

  @column({ columnName: "file_type" })
  declare fileType: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  public static async deleteByKey(key: string) {
    return FileEntry.query().where("id", key).delete();
  }

  public static async deleteByKeyAndReturnResult(
    key: string,
  ): Promise<boolean> {
    return FileEntry.query()
      .where("id", key)
      .delete()
      .then((res: number[]) => res.length > 0 && res[0] > 0);
  }

  public static async updateFileType(
    newFileType: string,
    existingFileKey: string,
  ) {
    return FileEntry.query()
      .where("id", existingFileKey)
      .update({ file_type: newFileType });
  }

  public static async getExtensionIfExists(
    key: string,
  ): Promise<string | undefined> {
    return FileEntry.find(key).then((res) => res?.fileType);
  }
}
