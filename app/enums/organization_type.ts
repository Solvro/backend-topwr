export enum OrganizationType {
  ScientificCircle = "scientific_circle",
  StudentOrganization = "student_organization",
  StudentMedium = "student_medium",
  CultureAgenda = "culture_agenda",
  StudentCouncil = "student_council",
}

export const organizationTypeEnumsValues = {
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
};
