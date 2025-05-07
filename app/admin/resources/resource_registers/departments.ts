import { RelationType } from "@adminjs/relations";

import { linkTypeAutodetectSetUp } from "#enums/link_type";
import Department from "#models/department";
import DepartmentLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";
import StudentOrganization from "#models/student_organization";

import { ResourceBuilder, normalizeResourceName } from "../resource_factory.js";

const navigation = {
  name: "Departments",
  icon: "Book",
};

export const DepartmentsBuilder: ResourceBuilder = {
  builders: [
    { forModel: FieldsOfStudy, isRelationTarget: true },
    {
      forModel: DepartmentLink,
      ...linkTypeAutodetectSetUp,
      isRelationTarget: true,
    },
    {
      forModel: Department,
      additionalProperties: { description: { type: "richtext" } },
      addImageHandlingForProperties: ["logoKey"],
      ownedRelations: [
        {
          displayLabel: "Department links",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(DepartmentsLink),
              joinKey: DepartmentsLink.getDepartmentRelationKey(),
            },
          },
        },
        {
          displayLabel: "Fields of study",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(FieldsOfStudy),
              joinKey: FieldsOfStudy.getDepartmentRelationKey(),
            },
          },
        },
        {
          displayLabel: "Student organization",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(StudentOrganization),
              joinKey: StudentOrganization.getDepartmentRelationKey(),
            },
          },
        },
      ],
    },
  ],
  navigation,
};
