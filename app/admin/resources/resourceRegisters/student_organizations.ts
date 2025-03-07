import { linkTypeEnumsValues } from "#enums/link_type";
import { organizationSourceEnumsValues } from "#enums/organization_source";
import { organizationTypeEnumsValues } from "#enums/organization_type";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { ResourceBuilder, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Student Organizations",
  icon: "Cpu",
};

export function setUpStudentOrganizations(): ResourceBuilder {
  const info: ResourceInfo[] = [
    {
      forModel: StudentOrganization,
      additionalProperties: {
        description: {
          type: "richtext",
        },
        organizationType: organizationTypeEnumsValues,
        source: organizationSourceEnumsValues,
      },
    },
    {
      forModel: StudentOrganizationLink,
      additionalProperties: { type: linkTypeEnumsValues },
    },
    {
      forModel: StudentOrganizationTag,
      additionalProperties: { description: { type: "richtext" } },
      addImageHandling: true,
    },
  ];
  return {
    navigation,
    builders: info,
  };
}
