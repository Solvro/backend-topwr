import { RelationType } from "@adminjs/relations";

import { linkTypeAutodetectSetUp } from "#enums/link_type";
import { organizationSourceEnumsValues } from "#enums/organization_source";
import { organizationStatusEnumsValues } from "#enums/organization_status";
import { organizationTypeEnumsValues } from "#enums/organization_type";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";
import {
  anyCaseToPlural_snake_case,
  getOneToManyRelationForeignKey,
} from "#utils/model_utils";

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
        organizationStatus: organizationStatusEnumsValues,
      },
      addImageHandlingForProperties: ["coverKey", "logoKey"],
      ownedRelations: [
        {
          displayLabel: "Student Organization Links",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(StudentOrganizationLink),
              joinKey: getOneToManyRelationForeignKey(
                StudentOrganization,
                "test",
              ),
            },
          },
        },
      ],
      isRelationTarget: true,
    },
    {
      forModel: StudentOrganizationLink,
      ...linkTypeAutodetectSetUp,
      isRelationTarget: true,
    },
    {
      forModel: StudentOrganizationTag,
      additionalProperties: { description: { type: "richtext" } },
    },
  ],
  navigation,
};
