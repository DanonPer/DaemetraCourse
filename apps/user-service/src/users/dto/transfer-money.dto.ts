import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class TransferMoneyDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID отправителя',
  })
  @IsUUID('4')
  readonly fromUserId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID получателя',
  })
  @IsUUID('4')
  readonly toUserId: string;

  @ApiProperty({
    example: '20.51',
    description: 'Сумма перевода в долларах. До 2 знаков после запятой',
  })
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'Сумма должна быть положительным числом с точностью до 2 знаков после запятой',
  })
  readonly amount: string;
}
