export enum StudiesType {
  FirstDegree = "1DEGREE",
  SecondDegree = "2DEGREE",
  Uniform = "UNIFORM",
}

export function mapToStudiesType(value: string): StudiesType | undefined {
  switch (value) {
    case "1DEGREE":
      return StudiesType.FirstDegree;
    case "2DEGREE":
      return StudiesType.SecondDegree;
    case "UNIFORM":
      return StudiesType.Uniform;
    default:
      return undefined;
  }
}
