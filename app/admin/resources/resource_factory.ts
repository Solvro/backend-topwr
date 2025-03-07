import { LucidResource } from "@adminjs/adonis";
import {
  ActionRequest,
  PropertyOptions,
  ResourceOptions,
  ResourceWithOptions,
} from "adminjs";

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

export interface ResourceInfo {
  forModel: LucidModel;
  additionalProperties?: Record<string, PropertyOptions>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalActions?: Record<string, any>;
  additionalOptions?: ResourceOptions;
  addImageHandling?: boolean;
}

const hideOnEdit = {
  edit: false,
  show: true,
  new: false,
  list: true,
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

  public buildResources() {
    return this.registeredResources
      .map((resourceBuilder) => this.createResources(resourceBuilder))
      .flat(1);
  }

  public createResources(
    resourceBuilder: ResourceBuilder,
  ): ResourceWithOptions[] {
    return resourceBuilder.builders.map((resourceInfo) => {
      return ResourceFactory.createResource(
        resourceInfo.forModel,
        resourceBuilder.navigation,
        resourceInfo.additionalProperties,
        resourceInfo.additionalActions,
        resourceInfo.additionalOptions,
        resourceInfo.addImageHandling,
      );
    });
  }

  private static createResource(
    resourceModel: LucidModel,
    resourceNavigation: ResourceNavigation,
    additionalProperties?: Record<string, PropertyOptions>,
    additionalActions?: Record<string, PropertyOptions>,
    additionalOptions?: ResourceOptions,
    addImageHandling = false,
  ): ResourceWithOptions {
    const newResource: ResourceWithOptions = {
      resource: new LucidResource(resourceModel, DB_DRIVER),
      options: {
        navigation: resourceNavigation,
        properties: {
          ...readOnlyTimestamps,
        },
      },
    };
    if (additionalOptions !== undefined) {
      newResource.options = {
        ...newResource.options,
        ...additionalOptions,
      };
    }
    if (additionalProperties !== undefined) {
      newResource.options.properties = {
        ...newResource.options.properties,
        ...additionalProperties,
      };
    }
    if (additionalActions !== undefined) {
      newResource.options.actions = {
        ...newResource.options.actions,
        ...additionalActions,
      };
    }
    if (addImageHandling) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static addNewUploadHook(additionalNewActions?: Record<string, any>) {
    return {
      ...additionalNewActions,
      before: async (request: ActionRequest): Promise<ActionRequest> => {
        if (request.payload?.uploadPhoto !== undefined) {
          request.payload = {
            ...request.payload,
            cover: await FilesService.uploadMultipartFile(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              request.payload.uploadPhoto,
            ),
          };
          delete request.payload.uploadPhoto;
        }
        return request;
      },
    };
  }

  private static addEditUploadHook(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalEditActions?: Record<string, any>,
  ) {
    return {
      ...additionalEditActions,
      before: async (request: ActionRequest): Promise<ActionRequest> => {
        if (request.payload?.uploadPhoto !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const currentCover: string | null | undefined = request.payload.cover;
          if (currentCover !== undefined && currentCover !== null) {
            request.payload = {
              ...request.payload,
              cover: await FilesService.replaceWithMultipartFile(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                request.payload.uploadPhoto,
                FilesService.extractFileKeyFromDiskKey(currentCover),
              ),
            };
          } else {
            request.payload = {
              ...request.payload,
              cover: await FilesService.uploadMultipartFile(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                request.payload.uploadPhoto,
              ),
            };
          }
          delete request.payload.uploadPhoto;
        }
        return request;
      },
    };
  }

  private static addDeleteHook(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalDeleteActions?: Record<string, any>,
  ) {
    return {
      ...additionalDeleteActions,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      after: async (entity: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-non-null-assertion
        const currentCover: string | undefined | null =
          entity!.record!.params?.cover;
        if (currentCover !== undefined && currentCover !== null) {
          await FilesService.deleteFileWithDiskKey(currentCover);
        }
        return entity;
      },
    };
  }
}
