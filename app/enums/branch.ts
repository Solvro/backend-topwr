export enum Branch {
  Main = "main",
  JeleniaGora = "jelenia_gora",
  Walbrzych = "walbrzych",
  Legnica = "legnica",
}

export const branchEnumValues = {
  availableValues: [
    {
      value: Branch.Main,
      label: "Main campus",
    },
    {
      value: Branch.JeleniaGora,
      label: "Branch in Jelenia Gora",
    },
    {
      value: Branch.Walbrzych,
      label: "Branch in Walbrzych",
    },
    {
      value: Branch.Legnica,
      label: "Branch in Legnica",
    },
  ],
};
