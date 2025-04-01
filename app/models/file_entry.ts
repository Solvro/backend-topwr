import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import type { UUID } from "node:crypto";

import drive from "@adonisjs/drive/services/main";
import {
  BaseModel,
  afterFetch,
  afterFind,
  column,
  computed,
} from "@adonisjs/lucid/orm";

export default class FileEntry extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID;

  @column({ columnName: "file_extension" })
  declare fileExtension: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @computed()
  url: string | undefined;

  get keyWithExtension() {
    return `${this.id}.${this.fileExtension}`;
  }

  async computeExtraProps() {
    this.url = await drive.use().getUrl(this.keyWithExtension);
  }

  @afterFetch()
  static async afterFetch(files: FileEntry[]) {
    await Promise.all(files.map((f) => f.computeExtraProps()));
  }

  @afterFind()
  static async afterFind(file: FileEntry) {
    await file.computeExtraProps();
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
