export const RATE_LIMIT_OPTIONS = 'RATE_LIMIT_OPTIONS';

export type RateLimitOptions = {
    /** Cantidad máxima de requests permitidas */
    limit: number;
    /** Ventana en segundos */
    ttlSeconds: number;
    /**
     * Prefix para armar la key en Redis
     * ej: "auth:login" -> ratelimit:auth:login:<ip>
     */
    keyPrefix: string;
};
