import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfig } from '@nestjs/config';

@Global()
@Module({
    imports: [
        NestConfig.forRoot({
            isGlobal: true,
        }),
    ],
})
export class ConfigModule { }
