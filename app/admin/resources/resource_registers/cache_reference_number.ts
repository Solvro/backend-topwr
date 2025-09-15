import { HrefContext } from "adminjs";

import MobileConfig from "#models/mobile_config";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Mobile Config",
  icon: "Layers",
};

export const MobileConfigBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: MobileConfig,
      additionalProperties: {
        id: {
          isVisible: false,
        },
      },
      additionalOptions: {
        href: ({ h, resource }: HrefContext): string => {
          return h.showUrl(resource.decorate().id(), "1", undefined);
        },
      },
      additionalActions: {
        new: {
          isAccessible: false,
          isVisible: false,
        },
        delete: {
          isAccessible: false,
          isVisible: false,
        },
        bulkDelete: {
          isAccessible: false,
          isVisible: false,
        },
        edit: {
          isAccessible: false,
          isVisible: false,
        },
        refresh: {
          actionType: "record",
          icon: "RefreshCw",
          handler: async (_, __, context) => {
            const { record } = context;
            if (record !== undefined) {
              const old = record.get("referenceNumber") as number;
              await record.update({ referenceNumber: old + 1 });
              return { record: record.toJSON(context.currentAdmin) };
            }
          },
          component: false,
          // TODO: this needs localization
          guard: "confirmRefresh",
        },
      },
    },
  ],
  navigation,
};
