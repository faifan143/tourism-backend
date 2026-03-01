import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class SuggestTripDto {
  @IsOptional()
  @IsUUID()
  startCityId?: string;

  @IsOptional()
  @IsUUID()
  endCityId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
