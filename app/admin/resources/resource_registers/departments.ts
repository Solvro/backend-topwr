import { linkTypeAutodetectSetUp } from "#enums/link_type";
import Department from "#models/department";
import DepartmentLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "departmentsNavigation",
  icon: "Book",
};

export const DepartmentsBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: FieldsOfStudy,
      targetedByModels: [
        {
          ownerModel: Department,
        },
      ],
    },
    {
      forModel: DepartmentLink,
      ...linkTypeAutodetectSetUp,
      targetedByModels: [
        {
          ownerModel: Department,
        },
      ],
    },
    {
      forModel: Department,
      additionalProperties: { description: { type: "richtext" } },
      addImageHandlingForProperties: ["logoKey"],
      ownedRelations: [
        {
          displayLabel: "Department links",
          relationDefinition: {
            targetModel: DepartmentLink,
          },
        },
        {
          displayLabel: "Fields of study",
          relationDefinition: {
            targetModel: FieldsOfStudy,
            targetModelPlural_camelCase: "fieldsOfStudy",
          },
        },
      ],
    },
  ],
  navigation,
};
