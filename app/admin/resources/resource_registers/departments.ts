import { RelationType } from "@adminjs/relations";

import { linkTypeAutodetectSetUp } from "#enums/link_type";
import Department from "#models/department";
import DepartmentLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";
import StudentOrganization from "#models/student_organization";
import {
  anyCaseToPlural_snake_case,
  getOneToManyRelationForeignKey,
} from "#utils/model_utils";

import { ResourceBuilder } from "../resource_factory.js";

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
              resourceId: anyCaseToPlural_snake_case(DepartmentLink),
              joinKey: getOneToManyRelationForeignKey(Department, "test"),
            },
          },
        },
        {
          displayLabel: "Fields of study",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(FieldsOfStudy),
              joinKey: getOneToManyRelationForeignKey(Department, "test"),
            },
          },
        },
        {
          displayLabel: "Student organization",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(StudentOrganization),
              joinKey: getOneToManyRelationForeignKey(Department, "test"),
            },
          },
        },
      ],
    },
  ],
  navigation,
};
