import { z } from 'zod';

export class AccountValidation {
    static readonly CREATE = z.object({
        username: z.string().min(1).max(100),
        password: z.string().min(1).max(100),
        label: z.string().max(100).optional(),
        isActive: z.boolean().optional().default(true),
        latitude: z.number().optional().default(-6.2088),
        longitude: z.number().optional().default(106.8456),
        city: z.string().max(100).optional().default('Jakarta'),
        proxyUrl: z.string().max(255).optional(),
    });

    static readonly UPDATE = z.object({
        username: z.string().min(1).max(100).optional(),
        password: z.string().min(1).max(100).optional(),
        label: z.string().max(100).optional(),
        isActive: z.boolean().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        city: z.string().max(100).optional(),
        proxyUrl: z.string().max(255).nullable().optional(),
    });
}
