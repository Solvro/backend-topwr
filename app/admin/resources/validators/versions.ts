import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class VersionResourceValidator {
  constructor(
    name: string,
    milestoneId: number,
    releaseDate: Date | undefined,
    description: string | undefined,
  ) {
    this.name = name;
    this.milestoneId = milestoneId;
    this.releaseDate = releaseDate;
    this.description = description;
  }

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  milestoneId: number;

  @IsOptional()
  @IsDate()
  releaseDate: Date | undefined;

  @IsOptional()
  @IsString()
  description: string | undefined;
}
