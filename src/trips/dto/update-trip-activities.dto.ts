import { IsArray, IsUUID } from 'class-validator';

export class UpdateTripActivitiesDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  activityIds!: string[];
}
