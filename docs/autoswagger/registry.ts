export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface SwaggerOperation {
  method: HttpMethod;
  path: string;
  operationId: string;
  tag?: string;
  requestSchema?: string;
  responseSchema?: string;
  responseIsArray?: boolean;
}

export interface SwaggerRouteContext {
  basePath: string;
}

class SwaggerRegistry {
  #operations: SwaggerOperation[] = [];

  register(operation: SwaggerOperation) {
    this.#operations.push(operation);
  }

  registerAtBasePath(
    basePath: string,
    operation: Omit<SwaggerOperation, "path"> & {
      path: string;
    },
  ) {
    const normalizedBasePath = basePath.replace(/\/+$/, "");
    const normalizedPath = operation.path.replace(/^\/+/, "");

    this.register({
      ...operation,
      path:
        normalizedPath.length === 0
          ? normalizedBasePath
          : `${normalizedBasePath}/${normalizedPath}`,
    });
  }
  get operations(): readonly SwaggerOperation[] {
    return [...this.#operations];
  }
}

export const swaggerRegistry = new SwaggerRegistry();
