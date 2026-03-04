import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    HttpCode,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AccountService } from './account.service';

@Controller('/api/accounts')
export class AccountController {
    constructor(private readonly accountService: AccountService) { }

    @Get()
    @HttpCode(200)
    async findAll(
        @Query('page') page?: string,
        @Query('size') size?: string,
    ) {
        return this.accountService.findAll(
            page ? parseInt(page) : 1,
            size ? parseInt(size) : 20,
        );
    }

    @Get('template')
    async downloadTemplate(@Res() res: Response) {
        const buffer = await this.accountService.generateTemplate();
        res.set({
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition':
                'attachment; filename="template-import-akun.xlsx"',
        });
        res.send(buffer);
    }

    @Get(':id')
    @HttpCode(200)
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const account = await this.accountService.findOne(id);
        return { data: account };
    }

    @Post('import')
    @HttpCode(200)
    @UseInterceptors(FileInterceptor('file'))
    async importExcel(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            return { message: 'File tidak ditemukan', imported: 0, failed: 0 };
        }
        return this.accountService.importFromExcel(file.buffer);
    }

    @Post()
    @HttpCode(201)
    async create(@Body() body: any) {
        const account = await this.accountService.create(body);
        return { data: account };
    }

    @Put(':id')
    @HttpCode(200)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
    ) {
        const account = await this.accountService.update(id, body);
        return { data: account };
    }

    @Delete(':id')
    @HttpCode(200)
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.accountService.remove(id);
    }
}
