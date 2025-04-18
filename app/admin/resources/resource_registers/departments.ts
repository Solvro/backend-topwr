import { linkTypeAutodetectSetUp } from "#enums/link_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Departments",
  icon: "Book",
};

export const DepartmentsBuilder: ResourceBuilder = {
  builders: [
    { forModel: FieldsOfStudy },
    {
      forModel: DepartmentsLink,
      ...linkTypeAutodetectSetUp,
    },
    {
      forModel: Department,
      additionalProperties: { description: { type: "richtext" } },
      addImageHandlingForProperties: ["logoKey"],
    },
  ],
  navigation,
};
