export enum OrganizationStatus {
  Active = "active",
  Inactive = "inactive",
  Dissolved = "dissolved",
  Unknown = "unknown",
}

export const organizationStatusEnumsValues = {
  availableValues: [
    {
      value: OrganizationStatus.Active,
      label: "Active",
    },
    {
      value: OrganizationStatus.Inactive,
      label: "Inactive",
    },
    { value: OrganizationStatus.Dissolved, label: "Dissolved" },
    { value: OrganizationStatus.Unknown, label: "Unknown" },
  ],
};
