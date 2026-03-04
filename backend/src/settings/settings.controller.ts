import { Controller, Get, Put, Body, HttpCode } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('/api/settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    @HttpCode(200)
    async getAll() {
        return this.settingsService.getAll();
    }

    @Put()
    @HttpCode(200)
    async update(@Body() body: Record<string, string>) {
        return this.settingsService.update(body);
    }
}
