import { IsArray, IsUUID } from 'class-validator';

export class UpdateCategoriesDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds!: string[];
}
