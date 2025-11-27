import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
