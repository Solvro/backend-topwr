export enum ChangeType {
  Fix = "FIX",
  Feature = "FEATURE",
}

export const changeTypeEnumsValues = {
  availableValues: [
    { value: ChangeType.Fix, label: "Fix" },
    { value: ChangeType.Feature, label: "Feature" },
  ],
};
