export enum OrganizationType {
  ScientificClub = "scientific_club",
  StudentOrganization = "student_organization",
  StudentMedium = "student_medium",
  CultureAgenda = "culture_agenda",
  StudentCouncil = "student_council",
}

export const organizationTypeEnumsValues = {
  availableValues: [
    {
      value: OrganizationType.ScientificClub,
      label: "Scientific Club",
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
