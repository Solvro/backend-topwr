import type { LucidModel } from "@adonisjs/lucid/types/model";

import { AutogenCacheEntry } from "#utils/model_autogen";

import { getExistingModels } from "./getExistingModels.js";
import { swaggerRegistry } from "./registry.js";

export class AutoSwaggerService {
  private specTemplate = {
    openapi: "3.1.0",
    info: {
      title: "ToPWR API",
    },
    paths: {},
    components: {
      schemas: {} as Record<string, any>,
    },
  };

  public async generateSpec() {
    await this.generateSchemas();

    return {
      ...this.specTemplate,
      paths: this.generatePaths(),
    };
  }

  private async generateSchemas() {
    const models = await getExistingModels();

    for (const model of models) {
      const entry = AutogenCacheEntry.for(model);

      const createSchema = entry.storeValidator.toJSONSchema();
      const updateSchema = entry.updateValidator.toJSONSchema();

      this.applyColumnMetadata(model, createSchema);
      this.applyColumnMetadata(model, updateSchema);

      this.specTemplate.components.schemas[`${model.name}Create`] =
        createSchema;
      this.specTemplate.components.schemas[`${model.name}Update`] =
        updateSchema;
      this.specTemplate.components.schemas[`${model.name}Response`] =
        createSchema;
    }
  }

  private generatePaths() {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const operation of swaggerRegistry.operations) {
      const responses: Record<string, unknown> = {};

      if (operation.responseSchema === undefined) {
        responses["204"] = { description: "No content" };
      } else {
        responses["200"] = {
          description: "Successful response",
          content: {
            "application/json": {
              schema: operation.responseIsArray
                ? {
                    type: "array",
                    items: {
                      $ref: `#/components/schemas/${operation.responseSchema}`,
                    },
                  }
                : { $ref: `#/components/schemas/${operation.responseSchema}` },
            },
          },
        };
      }

      const openApiOperation: Record<string, unknown> = {
        operationId: operation.operationId,
        tags: [operation.tag ?? operation.operationId.split(".")[0]],
        responses,
      };

      const pathParameters = [
        ...operation.path.matchAll(/:([A-Za-z0-9_]+)|\{([^}]+)\}/g),
      ].map((match) => match[1] ?? match[2]);

      if (pathParameters.length > 0) {
        openApiOperation.parameters = pathParameters.map((param) => ({
          name: param,
          in: "path",
          required: true,
          schema: { type: "string" },
        }));
      }

      if (operation.requestSchema !== undefined) {
        openApiOperation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: `#/components/schemas/${operation.requestSchema}`,
              },
            },
          },
        };
      }

      const openApiPath = operation.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

      paths[openApiPath] ??= {};
      paths[openApiPath][operation.method] = openApiOperation;
    }

    return paths;
  }

  private applyColumnMetadata(model: LucidModel, schema: Record<string, any>) {
    const properties = schema.properties;

    if (properties === undefined) {
      return;
    }

    for (const [name, field] of model.$columnsDefinitions.entries()) {
      const property = properties[name];
      const typing = field.meta?.typing;

      if (property === undefined || typing === undefined) {
        continue;
      }

      if (typing.description !== undefined) {
        property.description = typing.description;
      }

      if (typing.dateFormat !== undefined) {
        const isNullable =
          Array.isArray(property.type) && property.type.includes("null");

        property.type = isNullable ? ["string", "null"] : "string";
        property.format =
          typing.dateFormat === "dateTime" ? "date-time" : typing.dateFormat;
      }
    }
  }
}
