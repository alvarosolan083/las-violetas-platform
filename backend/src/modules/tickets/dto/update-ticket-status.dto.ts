import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export type TicketStatusDto = (typeof STATUSES)[number];

export class UpdateTicketStatusDto {
    @ApiProperty({ enum: STATUSES, example: 'IN_PROGRESS' })
    @IsIn(STATUSES)
    status: TicketStatusDto;
}
