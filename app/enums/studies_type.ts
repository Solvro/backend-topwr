export enum StudiesType {
  FirstDegree = "1DEGREE",
  SecondDegree = "2DEGREE",
  LongCycle = "LONG_CYCLE",
}

export function mapToStudiesType(
  isLongCycle: boolean,
  isSecondDegree: boolean,
): StudiesType {
  if (isLongCycle) {
    return StudiesType.LongCycle;
  }
  if (isSecondDegree) {
    return StudiesType.SecondDegree;
  } else {
    return StudiesType.FirstDegree;
  }
}
