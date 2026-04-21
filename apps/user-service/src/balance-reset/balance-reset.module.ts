import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { BALANCE_RESET_QUEUE } from './balance-reset.constants';
import { BalanceResetController } from './balance-reset.controller';
import { BalanceResetProcessor } from './balance-reset.processor';
import { BalanceResetService } from './balance-reset.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BALANCE_RESET_QUEUE,
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [BalanceResetController],
  providers: [BalanceResetService, BalanceResetProcessor],
})
export class BalanceResetModule {}
