import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      `redis://${this.configService.get<string>('REDIS_HOST', 'localhost')}:${this.configService.get<string>('REDIS_PORT', '6379')}`,
    );

    this.client = createClient({ url: redisUrl });
    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleInit() {
    if (!this.client.isOpen) {
      await this.client.connect();
      this.logger.log('Redis cache connected');
    }
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.client.get(key);
    if (value === null) {
      return undefined;
    }

    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 30) {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  async deleteByPattern(pattern: string) {
    const keys: string[] = [];

    for await (const key of this.client.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(String(key));
    }

    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}
