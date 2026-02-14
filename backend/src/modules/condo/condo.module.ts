import { Module } from '@nestjs/common';
import { CondoMemberGuard } from './condo-member.guard';
import { CondoController } from './condo.controller';
import { CondoService } from './condo.service';

@Module({
    controllers: [CondoController],
    providers: [CondoMemberGuard, CondoService],
    exports: [CondoMemberGuard],
})
export class CondoModule { }
