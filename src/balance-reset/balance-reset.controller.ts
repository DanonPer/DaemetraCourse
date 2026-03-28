import { Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BalanceResetService } from './balance-reset.service';

@ApiTags('Сброс баланса')
@Controller('balance-reset')
export class BalanceResetController {
  private readonly logger = new Logger(BalanceResetController.name);

  constructor(private readonly balanceResetService: BalanceResetService) {}

  @ApiOperation({
    summary: 'Поставить задачу на обнуление баланса всем пользователям',
  })
  @ApiResponse({ status: 200 })
  @Post()
  @UseGuards(JwtAuthGuard)
  resetBalances() {
    this.logger.log(
      'Получен ручной запрос на постановку задачи сброса баланса',
    );
    return this.balanceResetService.enqueueManualReset();
  }
}
