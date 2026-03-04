import {
    Controller,
    Post,
    Get,
    Param,
    ParseIntPipe,
    HttpCode,
} from '@nestjs/common';
import { WorkerService } from './worker.service';

@Controller('/api/workers')
export class WorkerController {
    constructor(private readonly workerService: WorkerService) { }

    @Post('start-all')
    @HttpCode(200)
    async startAll() {
        return this.workerService.startAll();
    }

    @Post(':id/start')
    @HttpCode(200)
    async startOne(@Param('id', ParseIntPipe) id: number) {
        return this.workerService.startOne(id);
    }

    @Post('stop-all')
    @HttpCode(200)
    async stopAll() {
        return this.workerService.stopAll();
    }

    @Get('status')
    @HttpCode(200)
    async getStatus() {
        return this.workerService.getStatus();
    }

    @Get('pool-status')
    async getPoolStatus() {
        return this.workerService.getPoolStatus();
    }
}
