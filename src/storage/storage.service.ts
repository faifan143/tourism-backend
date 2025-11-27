import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import B2 from 'backblaze-b2';
import { ConfigService } from '../config/config.service';

export interface UploadResult {
  fileId: string;
  publicUrl: string;
}

interface BackblazeClient {
  authorize(): Promise<void>;
  getUploadUrl(params: { bucketId: string }): Promise<{
    data: {
      uploadUrl: string;
      authorizationToken: string;
    };
  }>;
  uploadFile(params: {
    uploadUrl: string;
    uploadAuthToken: string;
    fileName: string;
    data: Buffer;
    contentLength: number;
    mime: string;
    sha1: string;
  }): Promise<{
    data: {
      fileId: string;
      fileName: string;
    };
  }>;
  getFileInfo(params: { fileId: string }): Promise<{
    data: {
      fileName: string;
    };
  }>;
  deleteFileVersion(params: {
    fileId: string;
    fileName: string;
  }): Promise<unknown>;
}

type BackblazeConstructor = new (options: {
  applicationKeyId: string;
  applicationKey: string;
}) => BackblazeClient;

const BackblazeSdk = B2 as unknown as BackblazeConstructor;

export type StoredFile = {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly b2: BackblazeClient;
  private readonly bucketId: string;
  private readonly bucketEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.b2 = new BackblazeSdk({
      applicationKeyId: this.configService.get<string>('B2_KEY_ID'),
      applicationKey: this.configService.get<string>('B2_APPLICATION_KEY'),
    });
    this.bucketId = this.configService.get<string>('B2_BUCKET_ID');
    this.bucketEndpoint = this.configService.get<string>('B2_BUCKET_ENDPOINT');
  }

  async uploadFile(file: StoredFile): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    await this.authorize();

    const uploadUrlResponse = await this.b2.getUploadUrl({
      bucketId: this.bucketId,
    });

    const fileName = this.buildObjectKey(file.originalname);
    const sha1 = createHash('sha1').update(file.buffer).digest('hex');

    try {
      const uploadResponse = await this.b2.uploadFile({
        uploadUrl: uploadUrlResponse.data.uploadUrl,
        uploadAuthToken: uploadUrlResponse.data.authorizationToken,
        fileName,
        data: file.buffer,
        contentLength: file.size,
        mime: file.mimetype,
        sha1,
      });

      return {
        fileId: uploadResponse.data.fileId,
        publicUrl: this.buildPublicUrl(uploadResponse.data.fileName),
      };
    } catch (error) {
      this.logger.error(
        'Failed to upload file to Backblaze B2',
        error as Error,
      );
      throw new InternalServerErrorException('Unable to upload file');
    }
  }

  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    if (!fileId) {
      throw new BadRequestException('fileId is required.');
    }

    await this.authorize();

    try {
      const fileInfo = await this.b2.getFileInfo({ fileId });

      await this.b2.deleteFileVersion({
        fileId,
        fileName: fileInfo.data.fileName,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete file ${fileId} from Backblaze B2`,
        error as Error,
      );
      throw new InternalServerErrorException('Unable to delete file');
    }
  }

  private async authorize(): Promise<void> {
    try {
      await this.b2.authorize();
    } catch (error) {
      this.logger.error(
        'Failed to authorize Backblaze B2 client',
        error as Error,
      );
      throw new InternalServerErrorException('Storage service unavailable');
    }
  }

  private buildObjectKey(originalName: string): string {
    const uniqueSuffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
    const sanitizedName =
      originalName?.replace(/\s+/g, '-').replace(/[^\w.-]/g, '') || 'file';
    return `${uniqueSuffix}-${sanitizedName}`;
  }

  private buildPublicUrl(fileName: string): string {
    const normalizedEndpoint = this.bucketEndpoint.replace(/\/+$/, '');
    return `${normalizedEndpoint}/${encodeURIComponent(fileName)}`;
  }
}
