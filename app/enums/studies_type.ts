export enum StudiesType {
  FirstDegree = "1DEGREE",
  SecondDegree = "2DEGREE",
  LongCycle = "LONG_CYCLE",
}

export function mapToStudiesType(value: string): StudiesType | undefined {
  switch (value) {
    case "1DEGREE":
      return StudiesType.FirstDegree;
    case "2DEGREE":
      return StudiesType.SecondDegree;
    case "LONG_CYCLE":
      return StudiesType.LongCycle;
    default:
      return undefined;
  }
}
