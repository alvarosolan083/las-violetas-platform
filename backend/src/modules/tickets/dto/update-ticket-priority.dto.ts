import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TicketPriorityDto = (typeof PRIORITIES)[number];

export class UpdateTicketPriorityDto {
    @ApiProperty({ enum: PRIORITIES, example: 'HIGH' })
    @IsIn(PRIORITIES)
    priority: TicketPriorityDto;
}
