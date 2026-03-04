import {
    Controller,
    Get,
    Delete,
    Param,
    Query,
    ParseIntPipe,
    HttpCode,
} from '@nestjs/common';
import { LogService } from './log.service';

@Controller('/api/logs')
export class LogController {
    constructor(private readonly logService: LogService) { }

    @Get()
    @HttpCode(200)
    async findAll(
        @Query('page') page?: string,
        @Query('size') size?: string,
        @Query('accountId') accountId?: string,
    ) {
        return this.logService.findAll(
            page ? parseInt(page) : 1,
            size ? parseInt(size) : 20,
            accountId ? parseInt(accountId) : undefined,
        );
    }

    @Get('account/:id')
    @HttpCode(200)
    async findByAccount(
        @Param('id', ParseIntPipe) id: number,
        @Query('page') page?: string,
        @Query('size') size?: string,
    ) {
        return this.logService.findByAccount(
            id,
            page ? parseInt(page) : 1,
            size ? parseInt(size) : 20,
        );
    }

    @Delete()
    @HttpCode(200)
    async clearOld(@Query('days') days?: string) {
        return this.logService.clearOldLogs(days ? parseInt(days) : 30);
    }
}
