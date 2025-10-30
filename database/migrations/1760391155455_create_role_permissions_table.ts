import config from "@adonisjs/core/services/config";
import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    const tblPermissions = config.get<string>(
      "permissions.permissionsConfig.tables.permissions",
    );
    this.schema.createTable(tblPermissions, (table) => {
      this.primaryKey(table, "id");

      table.string("slug");
      table.string("title").nullable();
      table.string("entity_type").defaultTo("*");
      this.nullableModelId(table, "entity_id");
      table.string("scope").defaultTo("default");
      table.boolean("allowed").defaultTo(true);

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });

      table.index(["scope", "slug"]);
      table.index(["entity_type", "entity_id"]);
    });

    const tblRoles = config.get<string>(
      "permissions.permissionsConfig.tables.roles",
    );
    this.schema.createTable(tblRoles, (table) => {
      this.primaryKey(table, "id");

      table.string("slug");
      table.string("title").nullable();
      table.string("entity_type").defaultTo("*");
      this.nullableModelId(table, "entity_id");
      table.string("scope").defaultTo("default");
      table.boolean("allowed").defaultTo(true);

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });

      table.index(["scope", "slug"]);
      table.index(["entity_type", "entity_id"]);
    });

    const tblModelRoles = config.get<string>(
      "permissions.permissionsConfig.tables.modelRoles",
    );
    this.schema.createTable(tblModelRoles, (table) => {
      table.bigIncrements("id");

      table.string("model_type");
      this.modelId(table, "model_id");
      this.modelId(table, "role_id");

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });

      table.index(["model_type", "model_id"]);

      table.foreign("role_id").references(`${tblRoles}.id`).onDelete("CASCADE");
    });

    const tblModelPermissions = config.get<string>(
      "permissions.permissionsConfig.tables.modelPermissions",
    );
    this.schema.createTable(tblModelPermissions, (table) => {
      table.bigIncrements("id");

      table.string("model_type");
      this.modelId(table, "model_id");
      this.modelId(table, "permission_id");

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });

      table.index(["model_type", "model_id"]);

      table
        .foreign("permission_id")
        .references(`${tblPermissions}.id`)
        .onDelete("CASCADE");
    });
  }

  async down() {
    const tblPermissions = config.get<string>(
      "permissions.permissionsConfig.tables.permissions",
    );
    const tblRoles = config.get<string>(
      "permissions.permissionsConfig.tables.roles",
    );
    const tblModelRoles = config.get<string>(
      "permissions.permissionsConfig.tables.modelRoles",
    );
    const tblModelPermissions = config.get<string>(
      "permissions.permissionsConfig.tables.modelPermissions",
    );

    this.schema.dropTable(tblModelRoles);
    this.schema.dropTable(tblRoles);
    this.schema.dropTable(tblModelPermissions);
    this.schema.dropTable(tblPermissions);
  }

  private primaryKey(
    table: {
      string: (c: string) => { primary: () => unknown };
      bigIncrements: (c: string) => unknown;
    },
    columnName: string,
  ) {
    const uuidSupport = config.get<boolean>(
      "permissions.permissionsConfig.uuidSupport",
    );
    return uuidSupport
      ? table.string(columnName).primary()
      : table.bigIncrements(columnName);
  }

  private modelId(
    table: {
      string: (c: string) => { nullable?: () => unknown };
      bigint: (c: string) => { unsigned: () => unknown };
    },
    columnName: string,
  ) {
    const uuidSupport = config.get<boolean>(
      "permissions.permissionsConfig.uuidSupport",
    );
    return uuidSupport
      ? table.string(columnName)
      : table.bigint(columnName).unsigned();
  }

  private nullableModelId(
    table: {
      string: (c: string) => { nullable: () => unknown };
      bigint: (c: string) => { unsigned: () => unknown };
    },
    columnName: string,
  ) {
    const uuidSupport = config.get<boolean>(
      "permissions.permissionsConfig.uuidSupport",
    );
    if (uuidSupport) {
      table.string(columnName).nullable();
    } else {
      table.bigint(columnName).unsigned();
    }
  }
}
