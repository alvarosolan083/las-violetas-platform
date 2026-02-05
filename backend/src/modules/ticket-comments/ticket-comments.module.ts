import { Module } from '@nestjs/common';
import { TicketCommentsController } from './ticket-comments.controller';
import { TicketCommentsService } from './ticket-comments.service';

@Module({
    controllers: [TicketCommentsController],
    providers: [TicketCommentsService],
})
export class TicketCommentsModule { }
