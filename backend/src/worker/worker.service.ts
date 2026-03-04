import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from '../common/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { WarpPoolService } from './warp-pool.service';

@Injectable()
export class WorkerService {
    constructor(
        @InjectQueue('login-worker') private readonly loginQueue: Queue,
        private readonly prisma: PrismaService,
        private readonly settingsService: SettingsService,
        private readonly warpPool: WarpPoolService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) { }

    async startAll() {
        const accounts = await this.prisma.account.findMany({
            where: { isActive: true },
        });

        if (accounts.length === 0) {
            return { message: 'No active accounts', queued: 0 };
        }

        const jobs = accounts.map((acc) => ({
            name: 'login-job',
            data: {
                accountId: acc.id,
                username: acc.username,
                password: acc.password,
                latitude: acc.latitude,
                longitude: acc.longitude,
                proxyUrl: acc.proxyUrl,
            },
            opts: {
                attempts: 3,
                backoff: { type: 'exponential' as const, delay: 5000 },
                removeOnComplete: { age: 86400 },
                removeOnFail: { age: 604800 },
            },
        }));

        await this.loginQueue.addBulk(jobs);

        this.logger.info(`Queued ${jobs.length} login jobs`, {
            context: 'WorkerService',
        });

        return { message: `Queued ${jobs.length} accounts`, queued: jobs.length };
    }

    async startOne(accountId: number) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
        });

        if (!account) {
            return { message: 'Account not found' };
        }

        await this.loginQueue.add(
            'login-job',
            {
                accountId: account.id,
                username: account.username,
                password: account.password,
                latitude: account.latitude,
                longitude: account.longitude,
                proxyUrl: account.proxyUrl,
            },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: { age: 86400 },
                removeOnFail: { age: 604800 },
            },
        );

        this.logger.info(`Queued login job for account ${accountId}`, {
            context: 'WorkerService',
        });

        return { message: `Queued account ${account.username}` };
    }

    async stopAll() {
        await this.loginQueue.drain();
        this.logger.info('Drained all pending jobs', { context: 'WorkerService' });
        return { message: 'All pending jobs drained' };
    }

    async getStatus() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.loginQueue.getWaitingCount(),
            this.loginQueue.getActiveCount(),
            this.loginQueue.getCompletedCount(),
            this.loginQueue.getFailedCount(),
            this.loginQueue.getDelayedCount(),
        ]);

        return {
            data: { waiting, active, completed, failed, delayed },
        };
    }

    getPoolStatus() {
        return this.warpPool.getPoolStatus();
    }
}
