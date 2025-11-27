import { IsArray, IsUUID } from 'class-validator';

export class UpdateThemesDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  themeIds!: string[];
}
