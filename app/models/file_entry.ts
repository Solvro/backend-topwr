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

import { MINIATURES_DRIVE } from "#config/drive";
import { typedColumn } from "#decorators/typed_model";

export const PHOTO_LIKE_EXT = ["png", "jpg", "jpeg", "webp"];

export default class FileEntry extends BaseModel {
  public static selfAssignPrimaryKey = true;

  @typedColumn({ type: "uuid", isPrimary: true })
  declare id: UUID;

  @column({ columnName: "file_extension" })
  declare fileExtension: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @computed()
  url: string | undefined;

  @computed()
  miniaturesUrl: string | undefined;

  @computed()
  isPhoto() {
    return PHOTO_LIKE_EXT.includes(this.fileExtension);
  }

  get keyWithExtension() {
    return `${this.id}.${this.fileExtension}`;
  }

  async computeExtraProps() {
    this.url = await drive.use().getUrl(this.keyWithExtension);
    this.miniaturesUrl = this.isPhoto()
      ? await drive.use(MINIATURES_DRIVE).getUrl(this.keyWithExtension)
      : undefined;
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
