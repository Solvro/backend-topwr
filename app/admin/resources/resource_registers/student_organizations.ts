import { ActionRequest } from "adminjs";

import {
  DetectionResult,
  detectLinkType,
  linkTypeEnumsValues,
} from "#enums/link_type";
import { organizationSourceEnumsValues } from "#enums/organization_source";
import { organizationTypeEnumsValues } from "#enums/organization_type";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Student Organizations",
  icon: "Cpu",
};

export const StudentOrganizationsBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: StudentOrganization,
      additionalProperties: {
        description: {
          type: "richtext",
        },
        organizationType: organizationTypeEnumsValues,
        source: organizationSourceEnumsValues,
      },
      addImageHandlingForProperties: ["cover", "logo"],
    },
    {
      forModel: StudentOrganizationLink,
      additionalProperties: {
        type: {
          availableValues: linkTypeEnumsValues,
          isVisible: {
            list: true,
            show: true,
            filter: true,
            edit: false,
          },
        },
      },
      additionalActions: {
        new: {
          before: autoReplaceLinkType,
        },
        edit: {
          before: autoReplaceLinkType,
        },
      },
    },
    {
      forModel: StudentOrganizationTag,
      additionalProperties: { description: { type: "richtext" } },
    },
  ],
  navigation,
};

async function autoReplaceLinkType(
  request: ActionRequest,
): Promise<ActionRequest> {
  if (request.payload !== undefined) {
    if (request.payload.link !== undefined) {
      if (typeof request.payload.link !== "string") {
        throw new Error("Link must be a string");
      }
      const detectedType: DetectionResult = detectLinkType(
        request.payload.link,
      );
      if (detectedType.warning !== undefined) {
        throw new Error(detectedType.warning);
      }
      request.payload.type = detectedType.type;
    }
  }
  return request;
}
