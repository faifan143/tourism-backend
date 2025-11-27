import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
