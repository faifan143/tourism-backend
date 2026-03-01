import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OllamaService } from './ollama.service';
import { OllamaTripsService } from './ollama-trips.service';
import { OllamaController } from './ollama.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [OllamaController],
  providers: [OllamaService, OllamaTripsService],
  exports: [OllamaService, OllamaTripsService],
})
export class OllamaModule {}
