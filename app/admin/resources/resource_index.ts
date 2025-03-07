import { ResourceWithOptions } from "adminjs";

import { setUpAboutUs } from "./resourceRegisters/about_us.js";
import { setUpAcademicCalendars } from "./resourceRegisters/academic_calendars.js";
import { setUpAdminPanel } from "./resourceRegisters/admin_panel.js";
import { setUpBuildings } from "./resourceRegisters/buildings.js";
import { setUpDepartments } from "./resourceRegisters/departments.js";
import { setUpGuides } from "./resourceRegisters/guides.js";
import { setUpStudentOrganizations } from "./resourceRegisters/student_organizations.js";
import { setUpVersions } from "./resourceRegisters/versions.js";
import { ResourceBuilder, ResourceFactory } from "./resource_factory.js";

function setUpResources(): ResourceBuilder[] {
  return [
    setUpBuildings(),
    setUpAdminPanel(),
    setUpAcademicCalendars(),
    setUpGuides(),
    setUpAboutUs(),
    setUpDepartments(),
    setUpStudentOrganizations(),
    setUpVersions(),
  ];
}

function buildResources(): ResourceWithOptions[] {
  return new ResourceFactory(setUpResources()).buildResources();
}

export const adminJsResources = buildResources();
