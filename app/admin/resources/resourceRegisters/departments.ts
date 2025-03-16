import { linkTypeEnumsValues } from "#enums/link_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";

import { ResourceBuilder, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Departments",
  icon: "Book",
};

export function setUpDepartments(): ResourceBuilder {
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
  return {
    navigation,
    builders: info,
  };
}
