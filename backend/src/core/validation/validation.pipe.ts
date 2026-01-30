import {
    ValidationPipe,
    ValidationPipeOptions,
} from '@nestjs/common';

export function createValidationPipe() {
    const options: ValidationPipeOptions = {
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    };

    return new ValidationPipe(options);
}
