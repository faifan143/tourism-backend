import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '../config/config.service';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface UploadResult {
  fileId: string;
  publicUrl: string;
}

export type StoredFile = {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadsDir: string;
  private readonly publicUrlPrefix: string;

  constructor(private readonly configService: ConfigService) {
    // Use 'uploads' directory in the project root
    this.uploadsDir = join(process.cwd(), 'uploads');
    this.publicUrlPrefix = '/uploads';
    
    // Ensure uploads directory exists
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(this.uploadsDir, { recursive: true });
      this.logger.log(`Created uploads directory: ${this.uploadsDir}`);
    }
  }

  async uploadFile(file: StoredFile): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    await this.ensureUploadsDirectory();

    const fileName = this.buildFileName(file.originalname);
    const filePath = join(this.uploadsDir, fileName);

    try {
      await fs.writeFile(filePath, file.buffer);
      
      const publicUrl = `${this.publicUrlPrefix}/${fileName}`;

      this.logger.log(`File uploaded: ${fileName}`);

      return {
        fileId: fileName, // Use filename as fileId for local storage
        publicUrl,
      };
    } catch (error) {
      this.logger.error(
        'Failed to upload file to local storage',
        error as Error,
      );
      throw new InternalServerErrorException('Unable to upload file');
    }
  }

  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    if (!fileId) {
      throw new BadRequestException('fileId is required.');
    }

    // For local storage, fileId is the filename
    // Prevent directory traversal attacks
    const sanitizedFileName = this.sanitizeFileName(fileId);
    const filePath = join(this.uploadsDir, sanitizedFileName);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      
      this.logger.log(`File deleted: ${sanitizedFileName}`);
      return { success: true };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new BadRequestException('File not found.');
      }
      
      this.logger.error(
        `Failed to delete file ${sanitizedFileName} from local storage`,
        error as Error,
      );
      throw new InternalServerErrorException('Unable to delete file');
    }
  }

  private buildFileName(originalName: string): string {
    const uniqueSuffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
    const sanitizedName =
      originalName?.replace(/\s+/g, '-').replace(/[^\w.-]/g, '') || 'file';
    
    // Extract file extension
    const extension = sanitizedName.includes('.')
      ? sanitizedName.substring(sanitizedName.lastIndexOf('.'))
      : '';
    
    const nameWithoutExt = extension
      ? sanitizedName.substring(0, sanitizedName.lastIndexOf('.'))
      : sanitizedName;
    
    return `${uniqueSuffix}-${nameWithoutExt}${extension}`;
  }

  private sanitizeFileName(fileName: string): string {
    // Remove any path separators and prevent directory traversal
    return fileName.replace(/[/\\]/g, '').replace(/\.\./g, '');
  }
}
