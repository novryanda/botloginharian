import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const DEFAULTS: Record<string, string> = {
    waitTimeMinutes: '5',
    maxConcurrent: '10',
};

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAll() {
        const settings = await this.prisma.appSetting.findMany();
        const result: Record<string, string> = { ...DEFAULTS };
        for (const s of settings) {
            result[s.key] = s.value;
        }
        return { data: result };
    }

    async update(data: Record<string, string>) {
        const upserts = Object.entries(data).map(([key, value]) =>
            this.prisma.appSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            }),
        );
        await Promise.all(upserts);
        return this.getAll();
    }

    async getWaitTime(): Promise<number> {
        const setting = await this.prisma.appSetting.findUnique({
            where: { key: 'waitTimeMinutes' },
        });
        return parseInt(setting?.value || DEFAULTS.waitTimeMinutes, 10);
    }

    async getMaxConcurrent(): Promise<number> {
        const setting = await this.prisma.appSetting.findUnique({
            where: { key: 'maxConcurrent' },
        });
        return parseInt(setting?.value || DEFAULTS.maxConcurrent, 10);
    }
}
