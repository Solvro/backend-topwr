export enum OrganizationSource {
  StudentDepartment = "student_department",
  Manual = "manual",
  PwrActive = "pwr_active",
}

export const organizationSourceEnumsValues = {
  availableValues: [
    {
      value: OrganizationSource.StudentDepartment,
      label: "Student Department",
    },
    { value: OrganizationSource.Manual, label: "Manual" },
    { value: OrganizationSource.PwrActive, label: "Pwr Active" },
  ],
};
