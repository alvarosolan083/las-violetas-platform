import { Module } from '@nestjs/common';
import { CondoMemberGuard } from './condo-member.guard';

@Module({
    providers: [CondoMemberGuard],
    exports: [CondoMemberGuard],
})
export class CondoModule { }
