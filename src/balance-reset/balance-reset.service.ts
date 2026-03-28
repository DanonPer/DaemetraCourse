import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bull';
import {
  BALANCE_RESET_JOB,
  BALANCE_RESET_QUEUE,
  BALANCE_RESET_REPEAT_JOB_ID,
  TEN_MINUTES_IN_MS,
} from './balance-reset.constants';

@Injectable()
export class BalanceResetService implements OnModuleInit {
  constructor(
    @InjectQueue(BALANCE_RESET_QUEUE)
    private readonly balanceResetQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.balanceResetQueue.add(
      BALANCE_RESET_JOB,
      { triggeredBy: 'system' },
      {
        jobId: BALANCE_RESET_REPEAT_JOB_ID,
        removeOnComplete: true,
        removeOnFail: false,
        repeat: {
          every: TEN_MINUTES_IN_MS,
        },
      },
    );
  }

  async enqueueManualReset() {
    const job = await this.balanceResetQueue.add(
      BALANCE_RESET_JOB,
      { triggeredBy: 'manual' },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return {
      message: 'Задача на обнуление баланса поставлена в очередь',
      jobId: job.id,
      queueName: BALANCE_RESET_QUEUE,
    };
  }
}
