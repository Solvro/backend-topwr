import { LucidResource } from "@adminjs/adonis";
import {
  RelationsFeatureOptions,
  owningRelationSettingsFeature,
  targetRelationSettingsFeature,
} from "@adminjs/relations";
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
import { LucidModel, ModelColumnOptions } from "@adonisjs/lucid/types/model";

import FilesService from "#services/files_service";
import env from "#start/env";

import { componentLoader } from "../component_loader.js";

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
  addImageHandlingForProperties?: string[];
  ownedRelations?: RelationsFeatureOptions;
  isRelationTarget?: boolean;
}

type LucidColumnDefinition = Omit<ModelColumnOptions, "meta"> & {
  meta?: {
    type: string;
    optional: boolean;
  };
};

const photoHandlerVisibility = {
  list: false,
  show: true,
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
    const beforeEditHooksToChain: BeforeHookLink[] = [];
    const afterEditHooksToChain: AfterHookLink[] = [];
    const beforeNewHooksToChain: BeforeHookLink[] = [];
    const afterDeleteHooksToChain: AfterHookLink[] = [];
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
    ResourceFactory.addTimezoneDatetimepickers(
      newResource,
      resourceInfo.forModel,
    );
    ResourceFactory.addImageHandling(
      newResource,
      resourceInfo,
      beforeNewHooksToChain,
      beforeEditHooksToChain,
      afterEditHooksToChain,
      afterDeleteHooksToChain,
    );
    ResourceFactory.addRelations(newResource, resourceInfo);
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
    return newResource;
  }

  private static addImageHandling(
    resource: ResourceWithProperties,
    resourceInfo: ResourceInfo,
    beforeNewHooksToChain: BeforeHookLink[],
    beforeEditHooksToChain: BeforeHookLink[],
    afterEditHooksToChain: AfterHookLink[],
    afterDeleteHooksToChain: AfterHookLink[],
  ) {
    if (resourceInfo.addImageHandlingForProperties !== undefined) {
      resourceInfo.addImageHandlingForProperties.forEach((propertyName) => {
        const uploadPropertyName = `_${propertyName}`;

        resource.options.properties[uploadPropertyName] = {
          type: "mixed",
          isVisible: photoHandlerVisibility,
          components: {
            edit: "PhotoDropbox",
            show: "PhotoDisplay",
          },
        };
        resource.options.properties[propertyName] = {
          isVisible: false,
        };
        beforeEditHooksToChain.push(
          ResourceFactory.createBeforeEditUploadHookLink(
            propertyName,
            uploadPropertyName,
          ),
        );
        afterEditHooksToChain.push(
          ResourceFactory.createAfterEditUploadHookLink(propertyName),
        );
        beforeNewHooksToChain.push(
          ResourceFactory.createBeforeNewUploadHookLink(
            propertyName,
            uploadPropertyName,
          ),
        );
        afterDeleteHooksToChain.push(
          ResourceFactory.createAfterDeleteUploadHookLink(propertyName),
        );
      });
    }
  }

  private static getDateFields(baseModel: LucidModel): string[] {
    const dateFields: string[] = [];
    baseModel.$columnsDefinitions.forEach(
      (def: LucidColumnDefinition, name: string) => {
        if (
          def.meta !== undefined &&
          (def.meta.type === "datetime" || def.meta.type === "date") &&
          name !== "createdAt" &&
          name !== "updatedAt"
        ) {
          dateFields.push(name);
        }
      },
    );
    return dateFields;
  }

  private static addTimezoneDatetimepickers(
    resource: ResourceWithProperties,
    baseModel: LucidModel,
  ) {
    const dateFields = ResourceFactory.getDateFields(baseModel);
    dateFields.forEach((dateField) => {
      resource.options.properties[dateField] = {
        ...resource.options.properties[dateField],
        components: {
          edit: "TimezoneDatepicker",
        },
      };
    });
  }

  private static addRelations(
    resource: ResourceWithProperties,
    resourceInfo: ResourceInfo,
  ) {
    const licenseKey = env.get("ADMIN_RELATIONS_KEY");
    if (licenseKey === undefined) {
      throw new Error("ADMIN_RELATIONS_KEY is not set");
    }
    if (resourceInfo.ownedRelations === undefined) {
      return;
    }
    this.addOwnedRelations(resource, resourceInfo, licenseKey);
    this.addTargetRelations(resource, resourceInfo);
  }

  private static addOwnedRelations(
    resource: ResourceWithProperties,
    resourceInfo: ResourceInfo,
    licenseKey: string,
  ) {
    if (resourceInfo.ownedRelations === undefined) {
      return;
    }
    if (resource.features === undefined) {
      resource.features = [];
    }
    resource.features.push(
      owningRelationSettingsFeature({
        componentLoader,
        licenseKey,
        relations: resourceInfo.ownedRelations,
      }),
    );
  }

  private static addTargetRelations(
    resource: ResourceWithProperties,
    resourceInfo: ResourceInfo,
  ) {
    if (
      resourceInfo.isRelationTarget === undefined ||
      !resourceInfo.isRelationTarget
    ) {
      return;
    }
    if (resource.features === undefined) {
      resource.features = [];
    }
    resource.features.push(targetRelationSettingsFeature());
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
  ): BeforeHookLink {
    return async (request: ActionRequest): Promise<ActionRequest> => {
      if (request.payload !== undefined) {
        //if any photo selected, upload it
        if (
          request.payload[uploadProperty] !== undefined &&
          request.payload[uploadProperty] !== null
        ) {
          const file = await FilesService.uploadMultipartFile(
            request.payload[uploadProperty] as MultipartFile,
          );
          request.payload[property] = file.id;
          delete request.payload[uploadProperty];
        }
      }
      return request;
    };
  }

  private static createBeforeEditUploadHookLink(
    property: string,
    uploadProperty: string,
  ): BeforeHookLink {
    return async (
      request: ActionRequest,
      context: ActionContext,
    ): Promise<ActionRequest> => {
      //do nothing
      if (request.payload === undefined) {
        return request;
      }
      //delete current
      if (request.payload[uploadProperty] === null) {
        if (typeof request.payload[property] === "string") {
          context[this.getOldPropertyKey(property)] = request.payload[property];
        }
        request.payload[property] = null;
      } else if (request.payload[uploadProperty] !== undefined) {
        //replace current
        if (typeof request.payload[property] === "string") {
          context[this.getOldPropertyKey(property)] = request.payload[property];
          const file = await FilesService.uploadMultipartFile(
            request.payload[uploadProperty] as MultipartFile,
          );
          request.payload[property] = file.id;
        } else {
          //upload new
          const file = await FilesService.uploadMultipartFile(
            request.payload[uploadProperty] as MultipartFile,
          );
          request.payload[property] = file.id;
        }
      }
      delete request.payload[uploadProperty];
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
      //delete the old file after having uploaded a new one
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
