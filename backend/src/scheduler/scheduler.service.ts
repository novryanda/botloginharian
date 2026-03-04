import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WorkerService } from '../worker/worker.service';

@Injectable()
export class SchedulerService {
    constructor(
        private readonly workerService: WorkerService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_7AM)
    async handleDailyLogin() {
        this.logger.info('Daily scheduled login triggered', {
            context: 'Scheduler',
        });
        await this.workerService.startAll();
    }
}
