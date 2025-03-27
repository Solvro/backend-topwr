import { BaseSeeder } from "@adonisjs/lucid/seeders";

import { LinkType } from "#enums/link_type";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationStatus } from "#enums/organization_status";
import { OrganizationType } from "#enums/organization_type";
import Department from "#models/department";
import StudentOrganization from "#models/student_organization";

export default class extends BaseSeeder {
  static environment = ["development", "testing"];
  async run() {
    const dep = await Department.first();
    const depId = dep?.id;
    if (depId === undefined) {
      return;
    }
    await StudentOrganization.createMany([
      {
        name: "Student Organization 1",
        departmentId: depId,
        logo: "https://via.placeholder.com/150",
        cover: "https://via.placeholder.com/150",
        description: "Description",
        shortDescription: "Short Description",
        coverPreview: true,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Active,
      },
      {
        name: "Student Organization 2",
        departmentId: depId,
        logo: "https://via.placeholder.com/150",
        cover: "https://via.placeholder.com/150",
        description: "Description",
        shortDescription: "Short Description",
        coverPreview: true,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Inactive,
      },
      {
        name: "Student Organization 3",
        departmentId: depId,
        logo: "https://via.placeholder.com/150",
        cover: "https://via.placeholder.com/150",
        description: "Description",
        shortDescription: "Short Description",
        coverPreview: true,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Dissolved,
      },
    ]);
    const org1 = await StudentOrganization.first();
    if (org1 === null) {
      return;
    }
    await org1.related("links").createMany([
      {
        link: "https://example.com",
        linkType: LinkType.LinkedIn,
      },
      {
        link: "https://example.com",
        linkType: LinkType.Default,
      },
    ]);
    await org1.related("tags").createMany([
      {
        tag: "Tag 1",
      },
      {
        tag: "Tag 2",
      },
    ]);
  }
}
