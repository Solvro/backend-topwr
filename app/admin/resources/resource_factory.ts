import { LucidResource } from "@adminjs/adonis";
import {
  Action,
  ActionContext,
  ActionRequest,
  ActionResponse,
  ParamsTypeValue,
  PropertyOptions,
  RecordActionResponse,
  RecordJSON,
  ResourceOptions,
  ResourceWithOptions,
} from "adminjs";

import logger from "@adonisjs/core/services/logger";
import { MultipartFile } from "@adonisjs/core/types/bodyparser";
import { LucidModel } from "@adonisjs/lucid/types/model";

import FilesService from "#services/files_service";

export interface ResourceNavigation {
  name: string;
  icon: string;
}

export interface ResourceBuilder {
  navigation: ResourceNavigation;
  builders: ResourceInfo[];
}

type ImprovedRecordJSON = Omit<RecordJSON, "params"> & {
  params: Record<string, ParamsTypeValue>;
};
type ImprovedRecordActionResponse = Omit<RecordActionResponse, "record"> & {
  record: ImprovedRecordJSON;
};
export type ActionMap = Record<string, Partial<Action<ActionResponse>>>;
type SubAction =
  | Partial<Action<ActionResponse>>
  | Partial<Action<RecordActionResponse>>;
type HookReturnValue = Partial<Action<RecordActionResponse>>;
type ContextWithCover = ActionContext & {
  old_cover?: string;
};
type ResourceOptionsWithProperties = Omit<ResourceOptions, "properties"> & {
  properties: Record<string, PropertyOptions>;
};
type ResourceWithProperties = Omit<ResourceWithOptions, "options"> & {
  options: ResourceOptionsWithProperties;
};
type BeforeHookLink = (
  request: ActionRequest,
  context: ActionContext,
) => Promise<ActionRequest>;
type AfterHookLink = (
  entity: ImprovedRecordActionResponse,
  request?: ActionRequest,
  context?: ActionContext,
) => Promise<RecordActionResponse>;

export interface ResourceInfo {
  forModel: LucidModel;
  additionalProperties?: Record<string, PropertyOptions>;
  additionalActions?: ActionMap;
  additionalOptions?: ResourceOptions;
  addImageHandlingForProperties?: ImageHandlingForProperty[];
}

export interface ImageHandlingForProperty {
  property: string;
  allowRemoval: boolean;
}

const hideOnEdit = {
  list: true,
  show: true,
  filter: true,
  edit: false,
};

const hideOnShow = {
  list: false,
  show: false,
  filter: false,
  edit: true,
};

const DB_DRIVER = "postgres";

const readOnlyTimestamps = {
  createdAt: {
    type: "datetime" as const,
    isVisible: {
      edit: false,
      show: true,
      list: false,
      filter: true,
    },
  },
  updatedAt: {
    type: "datetime" as const,
    isVisible: {
      edit: false,
      show: true,
      list: false,
      filter: true,
    },
  },
} as const;

export class ResourceFactory {
  private registeredResources: ResourceBuilder[];

  constructor(registeredResources?: ResourceBuilder[]) {
    this.registeredResources = registeredResources ?? [];
  }

  public registerResource(resourceBuilder: ResourceBuilder) {
    this.registeredResources.push(resourceBuilder);
  }

  public buildResources(): ResourceWithOptions[] {
    return this.registeredResources
      .map((resourceBuilder) => this.createResources(resourceBuilder))
      .flat(1);
  }

  public createResources(
    resourceBuilder: ResourceBuilder,
  ): ResourceWithOptions[] {
    return resourceBuilder.builders.map((resourceInfo) => {
      return ResourceFactory.createResource(
        resourceInfo,
        resourceBuilder.navigation,
      );
    });
  }

  private static createResource(
    resourceInfo: ResourceInfo,
    navigation: ResourceNavigation,
  ): ResourceWithOptions {
    const newResource: ResourceWithProperties = {
      resource: new LucidResource(resourceInfo.forModel, DB_DRIVER),
      options: {
        navigation,
        properties: {
          ...readOnlyTimestamps,
        },
      },
    };
    if (resourceInfo.additionalOptions !== undefined) {
      newResource.options = {
        ...newResource.options,
        ...resourceInfo.additionalOptions,
      };
    }
    if (resourceInfo.additionalProperties !== undefined) {
      newResource.options.properties = {
        ...newResource.options.properties,
        ...resourceInfo.additionalProperties,
      };
    }
    if (resourceInfo.additionalActions !== undefined) {
      newResource.options.actions = {
        ...newResource.options.actions,
        ...resourceInfo.additionalActions,
      };
    }
    if (resourceInfo.addImageHandlingForProperties !== undefined) {
      const beforeEditHooksToChain: BeforeHookLink[] = [];
      const afterEditHooksToChain: AfterHookLink[] = [];
      const beforeNewHooksToChain: BeforeHookLink[] = [];
      const afterDeleteHooksToChain: AfterHookLink[] = [];
      resourceInfo.addImageHandlingForProperties.forEach((propertyInfo) => {
        const uploadPropertyName = `Upload new ${propertyInfo.property}`;
        newResource.options.properties[uploadPropertyName] = {
          type: "mixed",
          isVisible: hideOnShow,
          components: {
            edit: "PhotoDropbox",
          },
          custom: {
            previewSourceProperty: propertyInfo.property,
          },
        };
        newResource.options.properties[propertyInfo.property] = {
          isVisible: hideOnEdit,
        };
        if (propertyInfo.allowRemoval) {
          const removePropertyName = `Remove current ${propertyInfo.property}`;
          newResource.options.properties[removePropertyName] = {
            type: "boolean",
            isVisible: hideOnShow,
          };
          beforeEditHooksToChain.push(
            ResourceFactory.createBeforeEditUploadHookLink(
              propertyInfo.property,
              uploadPropertyName,
              removePropertyName,
            ),
          );
          beforeNewHooksToChain.push(
            ResourceFactory.createBeforeNewUploadHookLink(
              propertyInfo.property,
              uploadPropertyName,
              removePropertyName,
            ),
          );
        } else {
          beforeEditHooksToChain.push(
            ResourceFactory.createBeforeEditUploadHookLink(
              propertyInfo.property,
              uploadPropertyName,
            ),
          );
        }
        afterEditHooksToChain.push(
          ResourceFactory.createAfterEditUploadHookLink(propertyInfo.property),
        );
        beforeNewHooksToChain.push(
          ResourceFactory.createBeforeNewUploadHookLink(
            propertyInfo.property,
            uploadPropertyName,
          ),
        );
        afterDeleteHooksToChain.push(
          ResourceFactory.createAfterDeleteUploadHookLink(
            propertyInfo.property,
          ),
        );
      });
      newResource.options.actions = {
        ...newResource.options.actions,
        new: this.addNewUploadHook(
          newResource.options.actions?.new,
          beforeNewHooksToChain,
          [],
        ),
        edit: this.addEditUploadHook(
          newResource.options.actions?.edit,
          beforeEditHooksToChain,
          afterEditHooksToChain,
        ),
        delete: this.addDeleteHook(
          newResource.options.actions?.delete,
          [],
          afterDeleteHooksToChain,
        ),
      };
    }
    return newResource;
  }

  private static addNewUploadHook(
    additionalNewActions?: SubAction,
    beforeNewHooksToChain?: BeforeHookLink[],
    afterNewHooksToChain?: AfterHookLink[],
  ): HookReturnValue {
    return {
      ...additionalNewActions,
      before: this.anchorBeforeHook(beforeNewHooksToChain),
      after: this.anchorAfterHook(afterNewHooksToChain),
    } as HookReturnValue;
  }

  private static addEditUploadHook(
    additionalEditActions?: SubAction,
    beforeEditHooksToChain?: BeforeHookLink[],
    afterEditHooksToChain?: AfterHookLink[],
  ): HookReturnValue {
    return {
      ...additionalEditActions,
      before: this.anchorBeforeHook(beforeEditHooksToChain),
      after: this.anchorAfterHook(afterEditHooksToChain),
    } as HookReturnValue;
  }

  private static addDeleteHook(
    additionalDeleteActions?: SubAction,
    beforeDeleteHooksToChain?: BeforeHookLink[],
    afterDeleteHooksToChain?: AfterHookLink[],
  ): HookReturnValue {
    return {
      ...additionalDeleteActions,
      before: this.anchorBeforeHook(beforeDeleteHooksToChain),
      after: this.anchorAfterHook(afterDeleteHooksToChain),
    } as HookReturnValue;
  }

  private static anchorBeforeHook(
    beforeHookLinksToChain?: BeforeHookLink[],
  ): BeforeHookLink {
    return async (
      request: ActionRequest,
      context: ActionContext,
    ): Promise<ActionRequest> => {
      if (
        beforeHookLinksToChain === undefined ||
        beforeHookLinksToChain.length === 0
      ) {
        return request;
      }
      for (const hookFn of beforeHookLinksToChain) {
        request = await hookFn(request, context);
      }
      return request;
    };
  }

  private static anchorAfterHook(
    afterHookLinksToChain?: AfterHookLink[],
  ): AfterHookLink {
    return async (
      entity: ImprovedRecordActionResponse,
      request?: ActionRequest,
      context?: ContextWithCover,
    ): Promise<RecordActionResponse> => {
      if (
        afterHookLinksToChain === undefined ||
        afterHookLinksToChain.length === 0
      ) {
        return entity;
      }
      for (const hookFn of afterHookLinksToChain) {
        entity = await hookFn(entity, request, context);
      }
      return entity;
    };
  }

  private static createBeforeNewUploadHookLink(
    property: string,
    uploadProperty: string,
    removeProperty?: string,
  ): BeforeHookLink {
    return async (request: ActionRequest): Promise<ActionRequest> => {
      if (request.payload !== undefined) {
        if (request.payload[uploadProperty] !== undefined) {
          request.payload[property] = await FilesService.uploadMultipartFile(
            request.payload[uploadProperty] as MultipartFile,
          );
          delete request.payload[uploadProperty];
        }
        if (removeProperty !== undefined) {
          delete request.payload[removeProperty];
        }
      }
      return request;
    };
  }

  private static createBeforeEditUploadHookLink(
    property: string,
    uploadProperty: string,
    removeProperty?: string,
  ): BeforeHookLink {
    return async (
      request: ActionRequest,
      context: ActionContext,
    ): Promise<ActionRequest> => {
      if (
        removeProperty !== undefined &&
        request.payload?.[removeProperty] === true
      ) {
        if (typeof request.payload[property] === "string") {
          context[this.getOldPropertyKey(property)] = request.payload[property];
        }
        request.payload[property] = null;
        delete request.payload[removeProperty];
        delete request.payload[uploadProperty];
      } else if (request.payload?.[uploadProperty] !== undefined) {
        if (typeof request.payload[property] === "string") {
          context[this.getOldPropertyKey(property)] = request.payload[property];
          request.payload[property] = await FilesService.uploadMultipartFile(
            request.payload[uploadProperty] as MultipartFile,
          );
        } else {
          request.payload[property] = await FilesService.uploadMultipartFile(
            request.payload[uploadProperty] as MultipartFile,
          );
        }
        delete request.payload[uploadProperty];
      }
      return request;
    };
  }

  private static createAfterEditUploadHookLink(
    property: string,
  ): AfterHookLink {
    return async (
      entity: ImprovedRecordActionResponse,
      _?: ActionRequest,
      context?: ActionContext,
    ): Promise<RecordActionResponse> => {
      const key = ResourceFactory.getOldPropertyKey(property);
      if (context !== undefined && typeof context[key] === "string") {
        const result = await FilesService.deleteFileWithKey(context[key]);
        if (!result) {
          logger.warn(
            "Cover edit: Old file does not exist - no file was deleted",
          );
        }
      }
      return entity;
    };
  }

  private static createAfterDeleteUploadHookLink(
    property: string,
  ): AfterHookLink {
    return async (
      entity: ImprovedRecordActionResponse,
    ): Promise<RecordActionResponse> => {
      const currentCover: ParamsTypeValue = entity.record.params[property];
      if (typeof currentCover === "string") {
        await FilesService.deleteFileWithKey(currentCover);
      }
      return entity;
    };
  }

  private static getOldPropertyKey(property: string): string {
    return `old_${property}`;
  }
}
