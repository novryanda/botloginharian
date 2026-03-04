import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SocksProxyAgent } from 'socks-proxy-agent';
import * as http from 'http';

const execAsync = promisify(exec);

type SlotStatus = 'standby' | 'in-use' | 'recycling';

interface WarpSlot {
    id: number;
    url: string;
    containerName: string;
    status: SlotStatus;
    usedBy: string | null;
}

interface WaitingRequest {
    resolve: (url: string) => void;
    jobId: string;
}

@Injectable()
export class WarpPoolService implements OnModuleInit {
    private slots: WarpSlot[] = [];
    private waitingQueue: WaitingRequest[] = [];

    constructor(
        private readonly config: ConfigService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) { }

    onModuleInit() {
        const poolSize = this.config.get<number>('WARP_POOL_SIZE', 10);
        const basePort = this.config.get<number>('WARP_POOL_BASE_PORT', 1081);
        const useDockerNet = this.config.get<string>('USE_DOCKER_NETWORK') === 'true';

        for (let i = 1; i <= poolSize; i++) {
            const containerName = `warp-pool-${i}`;
            const url = useDockerNet
                ? `socks5://${containerName}:1080`
                : `socks5://localhost:${basePort + i - 1}`;

            this.slots.push({
                id: i,
                url,
                containerName,
                status: 'standby',
                usedBy: null,
            });
        }

        this.logger.info(
            `Initialized ${poolSize} WARP pool slots (${useDockerNet ? 'Docker Network' : 'Localhost'})`,
            { context: 'WarpPool' },
        );
    }

    /**
     * Checkout a WARP proxy from the pool.
     * If all slots are in-use, waits until one becomes available.
     */
    async checkout(jobId: string): Promise<string> {
        const slot = this.slots.find((s) => s.status === 'standby');

        if (slot) {
            slot.status = 'in-use';
            slot.usedBy = jobId;
            this.logger.info(
                `[Pool] Checkout slot ${slot.id} (${slot.url}) → job ${jobId}`,
                { context: 'WarpPool' },
            );
            // Add jitter (1-5s) to help Cloudflare assign different IPs
            await this.sleep(1000 + Math.random() * 4000);
            return slot.url;
        }

        this.logger.warn(
            `[Pool] No slots available, job ${jobId} waiting...`,
            { context: 'WarpPool' },
        );

        return new Promise<string>((resolve) => {
            this.waitingQueue.push({ resolve, jobId });
        });
    }

    /**
     * Checkin a WARP proxy back to the pool after job completes.
     * Triggers background recycle (restart container → new IP).
     */
    async checkin(jobId: string): Promise<void> {
        const slot = this.slots.find((s) => s.usedBy === jobId);

        if (!slot) {
            this.logger.warn(
                `[Pool] Checkin failed: no slot found for job ${jobId}`,
                { context: 'WarpPool' },
            );
            return;
        }

        this.logger.info(
            `[Pool] Checkin slot ${slot.id} from job ${jobId}, recycling...`,
            { context: 'WarpPool' },
        );

        slot.status = 'recycling';
        slot.usedBy = null;

        // Recycle in background — non-blocking
        this.recycleInBackground(slot).catch((err) => {
            this.logger.error(
                `[Pool] Recycle failed for slot ${slot.id}: ${err.message}`,
                { context: 'WarpPool' },
            );
            // Even if recycle fails, mark as standby to avoid permanent lock
            slot.status = 'standby';
            this.processWaitingQueue(slot);
        });
    }

    /**
     * Get status of all pool slots (for API endpoint).
     */
    getPoolStatus() {
        return {
            data: {
                slots: this.slots.map((s) => ({
                    id: s.id,
                    url: s.url,
                    status: s.status,
                    usedBy: s.usedBy,
                })),
                waiting: this.waitingQueue.length,
                summary: {
                    total: this.slots.length,
                    standby: this.slots.filter((s) => s.status === 'standby').length,
                    inUse: this.slots.filter((s) => s.status === 'in-use').length,
                    recycling: this.slots.filter((s) => s.status === 'recycling').length,
                },
            },
        };
    }

    private async recycleInBackground(slot: WarpSlot): Promise<void> {
        try {
            // Add jitter (0-10s) to avoid simultaneous restarts
            await this.sleep(Math.random() * 10000);
            await execAsync(`docker restart ${slot.containerName}`);
            this.logger.info(
                `[Pool] Container ${slot.containerName} restarted, waiting for ready...`,
                { context: 'WarpPool' },
            );

            await this.waitUntilReady(slot.url, 30);

            this.logger.info(
                `[Pool] Slot ${slot.id} recycled and ready`,
                { context: 'WarpPool' },
            );
        } catch (err) {
            this.logger.warn(
                `[Pool] Slot ${slot.id} recycle partial failure, marking standby anyway`,
                { context: 'WarpPool' },
            );
        }

        slot.status = 'standby';
        this.processWaitingQueue(slot);
    }

    private processWaitingQueue(slot: WarpSlot): void {
        if (this.waitingQueue.length > 0 && slot.status === 'standby') {
            const next = this.waitingQueue.shift()!;
            slot.status = 'in-use';
            slot.usedBy = next.jobId;
            this.logger.info(
                `[Pool] Assigned recycled slot ${slot.id} → waiting job ${next.jobId}`,
                { context: 'WarpPool' },
            );
            next.resolve(slot.url);
        }
    }

    /**
     * Wait until a SOCKS5 proxy is responsive.
     */
    private async waitUntilReady(
        proxyUrl: string,
        timeoutSeconds: number,
    ): Promise<void> {
        const deadline = Date.now() + timeoutSeconds * 1000;

        while (Date.now() < deadline) {
            try {
                await this.checkProxy(proxyUrl);
                return; // Proxy is ready
            } catch {
                await this.sleep(2000);
            }
        }

        throw new Error(`Proxy ${proxyUrl} not ready within ${timeoutSeconds}s`);
    }

    private checkProxy(proxyUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const agent = new SocksProxyAgent(proxyUrl);
            const req = http.get(
                'http://cloudflare.com/cdn-cgi/trace',
                { agent, timeout: 5000 },
                (res) => {
                    res.resume();
                    if (res.statusCode && res.statusCode < 400) {
                        resolve();
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                },
            );
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    }

    /**
     * Fetch public IP through a specific proxy URL.
     */
    async getPublicIp(proxyUrl: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const agent = new SocksProxyAgent(proxyUrl);
            const req = http.get(
                'http://cloudflare.com/cdn-cgi/trace',
                { agent, timeout: 5000 },
                (res) => {
                    let data = '';
                    res.on('data', (chunk) => (data += chunk));
                    res.on('end', () => {
                        // cloudflare trace format is key=value lines
                        // we need 'ip=...'
                        const ipLine = data
                            .split('\n')
                            .find((line) => line.startsWith('ip='));
                        if (ipLine) {
                            resolve(ipLine.split('=')[1]);
                        } else {
                            reject(new Error('IP not found in trace response'));
                        }
                    });
                },
            );
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout fetching IP'));
            });
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
