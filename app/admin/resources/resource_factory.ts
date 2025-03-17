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

export interface ResourceInfo {
  forModel: LucidModel;
  additionalProperties?: Record<string, PropertyOptions>;
  additionalActions?: ActionMap;
  additionalOptions?: ResourceOptions;
  addImageHandling?: boolean;
}

const hideOnEdit = {
  list: true,
  show: true,
  new: false,
  edit: false,
};

const hideOnShow = {
  list: false,
  show: false,
  new: true,
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
    const newResource: ResourceWithOptions = {
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
    if (resourceInfo.addImageHandling === true) {
      newResource.options.properties = {
        ...newResource.options.properties,
        uploadPhoto: {
          type: "mixed",
          isVisible: hideOnShow,
          components: {
            edit: "PhotoDropbox",
          },
        },
        cover: {
          isVisible: hideOnEdit,
        },
      };
      newResource.options.actions = {
        ...newResource.options.actions,
        new: this.addNewUploadHook(newResource.options.actions?.new),
        edit: this.addEditUploadHook(newResource.options.actions?.edit),
        delete: this.addDeleteHook(newResource.options.actions?.delete),
      };
    }
    return newResource;
  }

  private static addNewUploadHook(
    additionalNewActions?: SubAction,
  ): HookReturnValue {
    return {
      ...additionalNewActions,
      before: async (request: ActionRequest): Promise<ActionRequest> => {
        if (request.payload?.uploadPhoto !== undefined) {
          request.payload = {
            ...request.payload,
            cover: await FilesService.uploadMultipartFile(
              request.payload.uploadPhoto as MultipartFile,
            ),
          };
          delete request.payload.uploadPhoto;
        }
        return request;
      },
    } as HookReturnValue;
  }

  private static addEditUploadHook(
    additionalEditActions?: SubAction,
  ): HookReturnValue {
    return {
      ...additionalEditActions,
      before: async (
        request: ActionRequest,
        context: ActionContext,
      ): Promise<ActionRequest> => {
        if (request.payload?.uploadPhoto !== undefined) {
          if (typeof request.payload.cover === "string") {
            context.old_cover = request.payload.cover;
            request.payload = {
              ...request.payload,
              cover: await FilesService.uploadMultipartFile(
                request.payload.uploadPhoto as MultipartFile,
              ),
            };
          } else {
            request.payload = {
              ...request.payload,
              cover: await FilesService.uploadMultipartFile(
                request.payload.uploadPhoto as MultipartFile,
              ),
            };
          }
          delete request.payload.uploadPhoto;
        }

        return request;
      },
      after: async (
        _: ImprovedRecordActionResponse,
        __: ActionRequest,
        context: ContextWithCover,
      ): Promise<RecordActionResponse> => {
        const oldCover: string | undefined = context.old_cover;
        if (typeof oldCover === "string") {
          await FilesService.deleteFileWithKey(oldCover);
        }
        return _;
      },
    } as HookReturnValue;
  }

  private static addDeleteHook(
    additionalDeleteActions?: SubAction,
  ): HookReturnValue {
    return {
      ...additionalDeleteActions,
      after: async (
        entity: ImprovedRecordActionResponse,
      ): Promise<RecordActionResponse> => {
        const currentCover: ParamsTypeValue = entity.record.params.cover;
        if (typeof currentCover === "string") {
          await FilesService.deleteFileWithKey(currentCover);
        }
        return entity;
      },
    } as HookReturnValue;
  }
}
