import { ResourceWithOptions } from "adminjs";

import { ResourceBuilder, ResourceFactory } from "./resource_factory.js";
import { AboutUsBuilder } from "./resource_registers/about_us.js";
import { AcademicCalendarsBuilder } from "./resource_registers/academic_calendars.js";
import { AdminPanelBuilder } from "./resource_registers/admin_panel.js";
import { BuildingsBuilder } from "./resource_registers/buildings.js";
import { DepartmentsBuilder } from "./resource_registers/departments.js";
import { GuidesBuilder } from "./resource_registers/guides.js";
import { StudentOrganizationsBuilder } from "./resource_registers/student_organizations.js";
import { VersionsBuilder } from "./resource_registers/versions.js";

function setUpResources(): ResourceBuilder[] {
  return [
    BuildingsBuilder,
    AdminPanelBuilder,
    AcademicCalendarsBuilder,
    GuidesBuilder,
    AboutUsBuilder,
    DepartmentsBuilder,
    StudentOrganizationsBuilder,
    VersionsBuilder,
  ];
}

function buildResources(): ResourceWithOptions[] {
  return new ResourceFactory(setUpResources()).buildResources();
}

export const adminJsResources = buildResources();
