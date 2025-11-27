import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmbeddingsService } from './embeddings.service';
import { EmbeddingsController } from './embeddings.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [EmbeddingsController],
  providers: [EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
