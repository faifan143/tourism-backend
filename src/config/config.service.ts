import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  /**
   * Retrieve and assert a required configuration value.
   */
  get<T = string>(key: string): T {
    const value = this.configService.get<T>(key);

    if (value === undefined || value === null) {
      throw new Error(`Missing configuration value for ${key}`);
    }

    return value;
  }

  /**
   * Retrieve an optional configuration value.
   */
  getOptional<T = string>(key: string, defaultValue?: T): T | undefined {
    if (defaultValue === undefined) {
      return this.configService.get<T>(key);
    }

    const value = this.configService.get<T>(key, defaultValue);
    return value;
  }
}
