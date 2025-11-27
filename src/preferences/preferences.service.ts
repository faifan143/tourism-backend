import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateImagePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string) {
    const preferences = await this.prisma.userPreference.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!preferences) {
      // Return empty preferences if none exist
      return {
        userId,
        vector: null,
      };
    }

    // Fetch vector using raw query since Prisma doesn't handle Vector type directly
    const result = await this.prisma.$queryRawUnsafe<
      Array<{ vector: string | null }>
    >(
      `SELECT vector::text as vector
       FROM "UserPreference"
       WHERE "userId" = $1`,
      userId,
    );

    const vectorString = result?.[0]?.vector;
    const vector = vectorString ? this.parseVectorString(vectorString) : null;

    return {
      id: preferences.id,
      userId: preferences.userId,
      vector,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // Validate vector if provided
    if (dto.vector && dto.vector.length !== 512) {
      throw new BadRequestException('Vector must have exactly 512 dimensions.');
    }

    // Check if preferences exist
    const existing = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (existing) {
      // Update existing preferences
      if (dto.vector) {
        const vectorString = `[${dto.vector.join(',')}]`;
        await this.prisma.$executeRawUnsafe(
          `UPDATE "UserPreference"
           SET vector = $1::vector
           WHERE "userId" = $2`,
          vectorString,
          userId,
        );
      }

      return this.getPreferences(userId);
    }

    // Create new preferences
    if (dto.vector) {
      const vectorString = `[${dto.vector.join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "UserPreference" (id, "userId", vector)
         VALUES (gen_random_uuid()::text, $1, $2::vector)`,
        userId,
        vectorString,
      );
    } else {
      await this.prisma.userPreference.create({
        data: {
          userId,
        },
      });
    }

    return this.getPreferences(userId);
  }

  async updateImagePreferences(userId: string, dto: UpdateImagePreferencesDto) {
    // Validate vector length
    if (dto.vector.length !== 512) {
      throw new BadRequestException('Vector must have exactly 512 dimensions.');
    }

    // Check if preferences exist
    const existing = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    const vectorString = `[${dto.vector.join(',')}]`;

    if (existing) {
      // Update existing preferences
      await this.prisma.$executeRawUnsafe(
        `UPDATE "UserPreference"
         SET vector = $1::vector
         WHERE "userId" = $2`,
        vectorString,
        userId,
      );
    } else {
      // Create new preferences with image vector
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "UserPreference" (id, "userId", vector)
         VALUES (gen_random_uuid()::text, $1, $2::vector)`,
        userId,
        vectorString,
      );
    }

    return this.getPreferences(userId);
  }

  private parseVectorString(vectorString: string): number[] {
    // Remove brackets and split by comma
    const cleaned = vectorString.replace(/[[\]]/g, '');
    return cleaned.split(',').map((val) => parseFloat(val.trim()));
  }
}
