import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';

@Injectable()
export class EmbeddingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForPlace(placeId: string, dto: CreateEmbeddingDto) {
    // Verify place exists
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true },
    });

    if (!place) {
      throw new NotFoundException('Place not found.');
    }

    // Validate vector length
    if (dto.vector.length !== 512) {
      throw new BadRequestException('Vector must have exactly 512 dimensions.');
    }

    // Check if embedding already exists
    const existing = await this.prisma.embedding.findUnique({
      where: { ownerId: placeId },
    });

    if (existing) {
      // Update existing embedding
      return this.updateEmbeddingVector(existing.id, dto.vector);
    }

    // Create new embedding using raw SQL for vector type
    const vectorString = `[${dto.vector.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "Embedding" (id, vector, "ownerType", "ownerId")
       VALUES (gen_random_uuid()::text, $1::vector, 'place', $2)`,
      vectorString,
      placeId,
    );

    // Fetch the created embedding
    return this.prisma.embedding.findUnique({
      where: { ownerId: placeId },
    });
  }

  async createForActivity(activityId: string, dto: CreateEmbeddingDto) {
    // Verify activity exists
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }

    // Validate vector length
    if (dto.vector.length !== 512) {
      throw new BadRequestException('Vector must have exactly 512 dimensions.');
    }

    // Check if embedding already exists
    const existing = await this.prisma.embedding.findUnique({
      where: { ownerId: activityId },
    });

    if (existing) {
      // Update existing embedding
      return this.updateEmbeddingVector(existing.id, dto.vector);
    }

    // Create new embedding using raw SQL for vector type
    const vectorString = `[${dto.vector.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "Embedding" (id, vector, "ownerType", "ownerId")
       VALUES (gen_random_uuid()::text, $1::vector, 'activity', $2)`,
      vectorString,
      activityId,
    );

    // Fetch the created embedding
    return this.prisma.embedding.findUnique({
      where: { ownerId: activityId },
    });
  }

  async getByPlaceId(placeId: string) {
    const embedding = await this.prisma.embedding.findUnique({
      where: { ownerId: placeId },
    });

    if (!embedding) {
      throw new NotFoundException('Embedding not found for this place.');
    }

    // Fetch vector using raw query since Prisma doesn't handle Vector type directly
    const result = await this.prisma.$queryRawUnsafe<Array<{ vector: string }>>(
      `SELECT vector::text as vector
       FROM "Embedding"
       WHERE "ownerId" = $1`,
      placeId,
    );

    if (!result || result.length === 0) {
      throw new NotFoundException('Embedding not found for this place.');
    }

    // Parse vector string back to number array
    const vectorString = result[0].vector;
    const vector = this.parseVectorString(vectorString);

    return {
      id: embedding.id,
      ownerType: embedding.ownerType,
      ownerId: embedding.ownerId,
      vector,
    };
  }

  private async updateEmbeddingVector(embeddingId: string, vector: number[]) {
    const vectorString = `[${vector.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE "Embedding"
       SET vector = $1::vector
       WHERE id = $2`,
      vectorString,
      embeddingId,
    );

    return this.prisma.embedding.findUnique({
      where: { id: embeddingId },
    });
  }

  private parseVectorString(vectorString: string): number[] {
    // Remove brackets and split by comma
    const cleaned = vectorString.replace(/[[\]]/g, '');
    return cleaned.split(',').map((val) => parseFloat(val.trim()));
  }
}
