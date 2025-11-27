import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(512)
  @ArrayMaxSize(512)
  @IsNumber({}, { each: true })
  vector?: number[];
}

export class UpdateImagePreferencesDto {
  @IsArray()
  @ArrayMinSize(512)
  @ArrayMaxSize(512)
  @IsNumber({}, { each: true })
  vector!: number[];
}
