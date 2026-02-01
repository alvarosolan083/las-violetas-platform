import { Module } from '@nestjs/common';
import { ConfigModule as NestConfig } from '@nestjs/config';

@Module({
    imports: [
        NestConfig.forRoot({
            isGlobal: true,
        }),
    ],
})
export class ConfigModule { }
