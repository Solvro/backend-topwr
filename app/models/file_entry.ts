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

  get diskKey() {
    return `${this.id}.${this.fileExtension}`;
  }

  public static createFileEntry(extname: string | undefined): FileEntry {
    const fileEntry = new FileEntry();
    fileEntry.id = randomUUID();
    fileEntry.fileExtension =
      extname !== undefined && extname.length > 0 ? extname : "bin";
    return fileEntry;
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

  public static async getExtensionIfExists(key: string) {
    return FileEntry.query()
      .select("file_extension")
      .where("id", key)
      .first()
      .then((value) => value?.fileExtension);
  }
}
