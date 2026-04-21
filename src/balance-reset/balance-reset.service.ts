import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bull';
import {
  BALANCE_RESET_JOB,
  BALANCE_RESET_QUEUE,
  BALANCE_RESET_REPEAT_JOB_ID,
  TEN_MINUTES_IN_MS,
} from './balance-reset.constants';

@Injectable()
export class BalanceResetService implements OnModuleInit {
  private readonly logger = new Logger(BalanceResetService.name);

  constructor(
    @InjectQueue(BALANCE_RESET_QUEUE)
    private readonly balanceResetQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log(
      'Регистрируется повторяющаяся задача на обнуление баланса каждые 10 минут',
    );

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

    this.logger.debug(
      `Повторяющаяся задача зарегистрирована: queue=${BALANCE_RESET_QUEUE}, job=${BALANCE_RESET_JOB}, repeatJobId=${BALANCE_RESET_REPEAT_JOB_ID}`,
    );
  }

  async enqueueManualReset() {
    this.logger.log(
      'Ручная задача на обнуление баланса отправляется в очередь',
    );

    const job = await this.balanceResetQueue.add(
      BALANCE_RESET_JOB,
      { triggeredBy: 'manual' },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.debug(
      `Ручная задача поставлена в очередь: queue=${BALANCE_RESET_QUEUE}, jobId=${job.id}`,
    );

    return {
      message: 'Задача на обнуление баланса поставлена в очередь',
      jobId: job.id,
      queueName: BALANCE_RESET_QUEUE,
    };
  }
}
