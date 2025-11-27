import { IsString, IsUrl } from 'class-validator';

export class AddImageDto {
  @IsString()
  @IsUrl()
  imageUrl!: string;
}
