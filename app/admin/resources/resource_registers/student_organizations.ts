import { RelationType } from "@adminjs/relations";

import { linkTypeAutodetectSetUp } from "#enums/link_type";
import { organizationSourceEnumsValues } from "#enums/organization_source";
import { organizationStatusEnumsValues } from "#enums/organization_status";
import { organizationTypeEnumsValues } from "#enums/organization_type";
import StudentOrganizationsStudentOrganizationTag from "#models/organization_tag_dummy";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { ResourceBuilder, normalizeResourceName } from "../resource_factory.js";

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
              resourceId: normalizeResourceName(StudentOrganizationLink),
              joinKey:
                StudentOrganizationLink.getStudentOrganizationRelationKey(),
            },
          },
        },
        {
          displayLabel: "Student Organization Tags",
          relation: {
            type: RelationType.ManyToMany,
            junction: {
              joinKey: "tag",
              inverseJoinKey: "student_organization_id",
              throughResourceId:
                "student_organizations_student_organization_tags", //pivot entity resource id
            },
            target: {
              resourceId: normalizeResourceName(StudentOrganizationTag),
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
      additionalProperties: {
        tag: {
          isId: true,
          isTitle: true,
          position: 1,
          isVisible: {
            list: true,
            edit: true,
            filter: true,
            show: true,
          },
        },
      },
      isRelationTarget: true,
    },
    {
      forModel: StudentOrganizationsStudentOrganizationTag,
      isRelationTarget: true,
    },
  ],
  navigation,
};
