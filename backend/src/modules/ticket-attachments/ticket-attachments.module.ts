import { Module } from '@nestjs/common';
import { TicketAttachmentsController } from './ticket-attachments.controller';
import { TicketAttachmentsService } from './ticket-attachments.service';

@Module({
    controllers: [TicketAttachmentsController],
    providers: [TicketAttachmentsService],
})
export class TicketAttachmentsModule { }
