import { linkTypeEnumsValues } from "#enums/link_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";

import { ResourceFactory, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Departments",
  icon: "Book",
};

export function setUpDepartments() {
  const info: ResourceInfo[] = [
    { forModel: FieldsOfStudy },
    {
      forModel: DepartmentsLink,
      additionalProperties: { linkType: linkTypeEnumsValues },
    },
    {
      forModel: Department,
      additionalProperties: { description: { type: "richtext" } },
    },
  ];
  ResourceFactory.registerResource({
    navigation,
    builders: info,
  });
}
