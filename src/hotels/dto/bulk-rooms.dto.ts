import { IsInt, IsOptional, Min } from 'class-validator';

export class BulkAddRoomsDto {
  @IsInt()
  @Min(1)
  count!: number;

  @IsOptional()
  roomNumberPrefix?: string;
}

export class BulkRemoveRoomsDto {
  @IsInt()
  @Min(1)
  count!: number;
}

