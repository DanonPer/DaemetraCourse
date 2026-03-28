import { Process, Processor } from '@nestjs/bull';
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
  constructor(private readonly usersService: UsersService) {}

  @Process(BALANCE_RESET_JOB)
  async handleBalanceReset(job: Job<BalanceResetJobData>) {
    const result = await this.usersService.resetAllBalances();

    return {
      triggeredBy: job.data.triggeredBy,
      modifiedCount: result.modifiedCount,
      processedAt: new Date().toISOString(),
    };
  }
}
