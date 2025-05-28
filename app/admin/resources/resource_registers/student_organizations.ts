import { linkTypeAutodetectSetUp } from "#enums/link_type";
import { organizationSourceEnumsValues } from "#enums/organization_source";
import { organizationStatusEnumsValues } from "#enums/organization_status";
import { organizationTypeEnumsValues } from "#enums/organization_type";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "organizationsNavigation",
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
        organizationStatus: organizationStatusEnumsValues,
      },
      addImageHandlingForProperties: ["coverKey", "logoKey"],
      ownedRelations: [
        {
          displayLabel: "Student Organization Links",
          relationDefinition: {
            targetModel: StudentOrganizationLink,
            targetModelPlural_camelCase: "links",
          },
        },
      ],
    },
    {
      forModel: StudentOrganizationLink,
      ...linkTypeAutodetectSetUp,
      targetedByModels: [
        {
          ownerModel: StudentOrganization,
          ownerModelSingular_camelCase: "organization",
        },
      ],
    },
    {
      forModel: StudentOrganizationTag,
      additionalProperties: { description: { type: "richtext" } },
    },
  ],
  navigation,
};
