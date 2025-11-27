import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class CreateEmbeddingDto {
  @IsArray()
  @ArrayMinSize(512)
  @ArrayMaxSize(512)
  @IsNumber({}, { each: true })
  vector!: number[];
}
