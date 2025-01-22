import { LucidResource } from "@adminjs/adonis";

import { LinkType } from "#enums/link_type";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationType } from "#enums/organization_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const departmentResource = {
  resource: new LucidResource(Department, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const departmentsLinkResource = {
  resource: new LucidResource(DepartmentsLink, "postgres"),
  options: {
    properties: {
      linkType: {
        availableValues: [
          { value: LinkType.Default, label: "Default" },
          { value: LinkType.Facebook, label: "Facebook" },
          { value: LinkType.Instagram, label: "Instagram" },
          { value: LinkType.LinkedIn, label: "LinkedIn" },
          { value: LinkType.Mail, label: "Mail" },
          { value: LinkType.YouTube, label: "YouTube" },
          { value: LinkType.GitHub, label: "GitHub" },
          { value: LinkType.TopwrBuildings, label: "TopwrBuildings" },
          { value: LinkType.Phone, label: "Phone" },
          { value: LinkType.X, label: "X" },
          { value: LinkType.TikTok, label: "TikTok" },
          { value: LinkType.Discord, label: "Discord" },
          { value: LinkType.Twitch, label: "Twitch" },
        ],
      },
      ...readOnlyTimestamps,
    },
  },
};

export const fieldsOfStudyResource = {
  resource: new LucidResource(FieldsOfStudy, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const studentOrganizationResource = {
  resource: new LucidResource(StudentOrganization, "postgres"),
  options: {
    properties: {
      organizationType: {
        availableValues: [
          {
            value: OrganizationType.ScientificCircle,
            label: "Scientific Circle",
          },
          {
            value: OrganizationType.StudentOrganization,
            label: "Student Organization",
          },
          { value: OrganizationType.StudentMedium, label: "Student Medium" },
          { value: OrganizationType.CultureAgenda, label: "Culture Agenda" },
          { value: OrganizationType.StudentCouncil, label: "Student council" },
        ],
      },
      source: {
        availableValues: [
          {
            value: OrganizationSource.StudentDepartment,
            label: "Student Department",
          },
          { value: OrganizationSource.Manual, label: "Manual" },
          { value: OrganizationSource.PwrActive, label: "Pwr Active" },
        ],
      },
      ...readOnlyTimestamps,
    },
  },
};

export const studentOrganizationLinkResource = {
  resource: new LucidResource(StudentOrganizationLink, "postgres"),
  options: {
    properties: {
      type: {
        availableValues: [
          { value: LinkType.Default, label: "Default" },
          { value: LinkType.Facebook, label: "Facebook" },
          { value: LinkType.Instagram, label: "Instagram" },
          { value: LinkType.LinkedIn, label: "LinkedIn" },
          { value: LinkType.Mail, label: "Mail" },
          { value: LinkType.YouTube, label: "YouTube" },
          { value: LinkType.GitHub, label: "GitHub" },
          { value: LinkType.TopwrBuildings, label: "TopwrBuildings" },
          { value: LinkType.Phone, label: "Phone" },
          { value: LinkType.X, label: "X" },
          { value: LinkType.TikTok, label: "TikTok" },
          { value: LinkType.Discord, label: "Discord" },
          { value: LinkType.Twitch, label: "Twitch" },
        ],
      },
      ...readOnlyTimestamps,
    },
  },
};

export const studentOrganizationTagResource = {
  resource: new LucidResource(StudentOrganizationTag, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
