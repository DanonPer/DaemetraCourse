import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { UsersService } from 'src/users/users.service';
import {
  BALANCE_RESET_JOB,
  BALANCE_RESET_QUEUE,
} from './balance-reset.constants';

type BalanceResetJobData = {
  triggeredBy: 'manual' | 'system';
};

@Processor(BALANCE_RESET_QUEUE)
export class BalanceResetProcessor {
  private readonly logger = new Logger(BalanceResetProcessor.name);

  constructor(private readonly usersService: UsersService) {}

  @Process(BALANCE_RESET_JOB)
  async handleBalanceReset(job: Job<BalanceResetJobData>) {
    this.logger.log(
      `Начата обработка job сброса баланса: jobId=${job.id}, triggeredBy=${job.data.triggeredBy}`,
    );

    const result = await this.usersService.resetAllBalances();

    this.logger.log(
      `Job сброса баланса завершена: jobId=${job.id}, modifiedCount=${result.modifiedCount}`,
    );

    return {
      triggeredBy: job.data.triggeredBy,
      modifiedCount: result.modifiedCount,
      processedAt: new Date().toISOString(),
    };
  }
}
