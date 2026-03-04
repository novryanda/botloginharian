import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { LoginProcessor } from './login.processor';
import { WarpPoolService } from './warp-pool.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [
        BullModule.registerQueue({ name: 'login-worker' }),
        SettingsModule,
    ],
    controllers: [WorkerController],
    providers: [WorkerService, LoginProcessor, WarpPoolService],
    exports: [WorkerService],
})
export class WorkerModule { }
