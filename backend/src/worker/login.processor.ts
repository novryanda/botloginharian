import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { chromium } from 'playwright';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from '../common/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { WarpPoolService } from './warp-pool.service';

interface LoginJobData {
    accountId: number;
    username: string;
    password: string;
    latitude: number | null;
    longitude: number | null;
    proxyUrl: string | null;
}

@Processor('login-worker', { concurrency: 10 })
export class LoginProcessor extends WorkerHost {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly settingsService: SettingsService,
        private readonly warpPool: WarpPoolService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        super();
    }

    async process(job: Job<LoginJobData>): Promise<any> {
        const { accountId, username, password, latitude, longitude, proxyUrl } =
            job.data;

        const startedAt = new Date();
        const logCtx = `Worker:${accountId}`;
        const jobId = String(job.id);

        // Track whether we used pool proxy (for checkin later)
        let usedPoolProxy = false;

        // Create initial log
        const logEntry = await this.prisma.workerLog.create({
            data: {
                accountId,
                status: 'running',
                message: 'Starting login process',
                startedAt,
            },
        });

        let browser;

        try {
            // Determine proxy: account-specific or checkout from pool
            let proxy: string;

            if (proxyUrl) {
                proxy = proxyUrl;
                this.logger.info(
                    `[${username}] Using account proxy: ${proxy}`,
                    { context: logCtx },
                );
            } else {
                proxy = await this.warpPool.checkout(jobId);
                usedPoolProxy = true;
                this.logger.info(
                    `[${username}] Checked out pool proxy: ${proxy}`,
                    { context: logCtx },
                );
            }

            // Optional: Fetch public IP for logging
            let publicIp = '-';
            try {
                publicIp = await this.warpPool.getPublicIp(proxy);
                this.logger.info(`[${username}] Public IP detected: ${publicIp}`, {
                    context: logCtx,
                });
            } catch (err) {
                this.logger.warn(`[${username}] Failed to fetch public IP: ${err.message}`, {
                    context: logCtx,
                });
            }

            // Update log with IP
            await this.prisma.workerLog.update({
                where: { id: logEntry.id },
                data: { ipAddress: publicIp },
            });

            // Launch Playwright
            browser = await chromium.launch({
                headless: true,
                proxy: { server: proxy },
            });

            const context = await browser.newContext({
                geolocation:
                    latitude && longitude ? { latitude, longitude } : undefined,
                permissions: latitude && longitude ? ['geolocation'] : [],
                userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            });

            const page = await context.newPage();

            // Step 1: Navigate to login page
            this.logger.info(`[${username}] Navigating to login page`, {
                context: logCtx,
            });
            await page.goto(
                'https://visa.ktbfuso.id/login?serviceURL=https://runner.ktbfuso.co.id/',
                { waitUntil: 'networkidle', timeout: 30000 },
            );

            // Step 2: Fill credentials
            this.logger.info(`[${username}] Filling credentials`, {
                context: logCtx,
            });
            await page.fill('#email_enc', username);
            await page.fill('#password', password);

            // Step 3: Click Sign In
            this.logger.info(`[${username}] Clicking Sign In`, {
                context: logCtx,
            });
            await page.click('.login-btn-submit');

            // Step 4: Wait for redirect to dashboard
            await page.waitForURL('**/dashboard**', { timeout: 30000 });

            this.logger.info(`[${username}] Login successful`, {
                context: logCtx,
            });

            // Update log: login success
            await this.prisma.workerLog.update({
                where: { id: logEntry.id },
                data: { status: 'login_success', message: 'Login successful' },
            });

            // Step 5: Wait configurable minutes
            const waitMinutes = await this.settingsService.getWaitTime();
            this.logger.info(
                `[${username}] Waiting ${waitMinutes} minutes before logout`,
                { context: logCtx },
            );
            await page.waitForTimeout(waitMinutes * 60 * 1000);

            // Step 6: Navigate to profile for logout
            this.logger.info(`[${username}] Navigating to profile for logout`, {
                context: logCtx,
            });
            await page.goto('https://runner.ktbfuso.co.id/profile', {
                waitUntil: 'networkidle',
                timeout: 30000,
            });

            // Step 7: Click Sign Out
            await page.click('button:has-text("Sign out")', { timeout: 15000 });
            this.logger.info(`[${username}] Logout successful`, {
                context: logCtx,
            });

            // Update log: complete
            await this.prisma.workerLog.update({
                where: { id: logEntry.id },
                data: {
                    status: 'logout_success',
                    message: `Login and logout completed successfully (proxy: ${proxy})`,
                    finishedAt: new Date(),
                },
            });

            return { success: true, username };
        } catch (error) {
            const errMsg =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`[${username}] Error: ${errMsg}`, {
                context: logCtx,
            });

            await this.prisma.workerLog.update({
                where: { id: logEntry.id },
                data: {
                    status: 'error',
                    message: errMsg.substring(0, 500),
                    finishedAt: new Date(),
                },
            });

            throw error; // BullMQ will retry
        } finally {
            if (browser) {
                await browser.close();
            }
            // Always checkin pool proxy, even on error
            if (usedPoolProxy) {
                await this.warpPool.checkin(jobId);
            }
        }
    }
}
