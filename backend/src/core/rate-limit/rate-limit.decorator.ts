import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_OPTIONS, RateLimitOptions } from './rate-limit.constants';

export const RateLimit = (options: RateLimitOptions) =>
    SetMetadata(RATE_LIMIT_OPTIONS, options);
