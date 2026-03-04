import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { WorkerModule } from '../worker/worker.module';

@Module({
    imports: [ScheduleModule.forRoot(), WorkerModule],
    providers: [SchedulerService],
})
export class SchedulerModule { }
