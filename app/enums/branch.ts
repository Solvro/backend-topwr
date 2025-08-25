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
      label: "Main branch",
    },
    {
      value: Branch.JeleniaGora,
      label: "Branch in w Jelenia Gora",
    },
    {
      value: Branch.Walbrzych,
      label: "Branch in w Walbrzych",
    },
    {
      value: Branch.Legnica,
      label: "Branch in w Legnica",
    },
  ],
};
