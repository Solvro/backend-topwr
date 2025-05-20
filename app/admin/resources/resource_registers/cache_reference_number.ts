import { HrefContext } from "adminjs";

import CacheReferenceNumber from "#models/cache_reference_number";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Cache reference number",
  icon: "Layers",
};

export const CacheRefNumberBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: CacheReferenceNumber,
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
