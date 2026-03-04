import { Injectable, Inject, HttpException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from '../common/prisma.service';
import { ValidationService } from '../common/validation.service';
import { AccountValidation } from './account.validation';
import * as ExcelJS from 'exceljs';

const CITIES: Record<string, { lat: number; lng: number }> = {
    Jakarta: { lat: -6.2088, lng: 106.8456 },
    Surabaya: { lat: -7.2575, lng: 112.7521 },
    Bandung: { lat: -6.9175, lng: 107.6191 },
    Medan: { lat: 3.5952, lng: 98.6722 },
    Semarang: { lat: -6.9666, lng: 110.4196 },
    Makassar: { lat: -5.1477, lng: 119.4327 },
    Palembang: { lat: -2.9761, lng: 104.7754 },
    Denpasar: { lat: -8.6705, lng: 115.2126 },
    Yogyakarta: { lat: -7.7956, lng: 110.3695 },
    Balikpapan: { lat: -1.2654, lng: 116.8311 },
};

@Injectable()
export class AccountService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) { }

    async findAll(page = 1, size = 20) {
        const skip = (page - 1) * size;
        const [accounts, total] = await Promise.all([
            this.prisma.account.findMany({
                skip,
                take: size,
                orderBy: { id: 'desc' },
                select: {
                    id: true,
                    username: true,
                    password: true,
                    label: true,
                    isActive: true,
                    latitude: true,
                    longitude: true,
                    city: true,
                    proxyUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.account.count(),
        ]);

        return {
            data: accounts,
            paging: {
                currentPage: page,
                size,
                totalPage: Math.ceil(total / size),
            },
        };
    }

    async findOne(id: number) {
        const account = await this.prisma.account.findUnique({ where: { id } });
        if (!account) throw new HttpException('Account not found', 404);
        return account;
    }

    async create(data: any) {
        const validated = this.validationService.validate(
            AccountValidation.CREATE,
            data,
        );
        this.logger.info(`Creating account: ${validated.username}`, {
            context: 'AccountService',
        });
        return this.prisma.account.create({ data: validated });
    }

    async update(id: number, data: any) {
        await this.findOne(id);
        const validated = this.validationService.validate(
            AccountValidation.UPDATE,
            data,
        );
        return this.prisma.account.update({ where: { id }, data: validated });
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.prisma.account.delete({ where: { id } });
        return { message: 'Account deleted' };
    }

    async findAllActive() {
        return this.prisma.account.findMany({ where: { isActive: true } });
    }

    /**
     * Generate Excel template (.xlsx) for account import.
     */
    async generateTemplate(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Akun');

        // Header row
        sheet.columns = [
            { header: 'username *', key: 'username', width: 30 },
            { header: 'password *', key: 'password', width: 20 },
            { header: 'label', key: 'label', width: 20 },
            { header: 'city', key: 'city', width: 15 },
            { header: 'latitude', key: 'latitude', width: 15 },
            { header: 'longitude', key: 'longitude', width: 15 },
            { header: 'proxyUrl', key: 'proxyUrl', width: 30 },
        ];

        // Style header
        const headerRow = sheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2563EB' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Example row
        sheet.addRow({
            username: 'user@example.com',
            password: 'password123',
            label: 'Kantor 1',
            city: 'Jakarta',
            latitude: -6.2088,
            longitude: 106.8456,
            proxyUrl: '',
        });

        // Notes row
        sheet.addRow({
            username: '← wajib diisi',
            password: '← wajib diisi',
            label: '← opsional',
            city: '← opsional (default: Jakarta)',
            latitude: '← auto dari city',
            longitude: '← auto dari city',
            proxyUrl: '← opsional',
        });

        const notesRow = sheet.getRow(3);
        notesRow.eachCell((cell) => {
            cell.font = { italic: true, color: { argb: 'FF9CA3AF' } };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Import accounts from uploaded Excel file.
     * Returns summary of imported/failed rows.
     */
    async importFromExcel(fileBuffer: Buffer): Promise<{
        imported: number;
        failed: number;
        errors: string[];
    }> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer);

        const sheet = workbook.getWorksheet(1);
        if (!sheet) {
            throw new HttpException('File Excel tidak memiliki worksheet', 400);
        }

        const rows: any[] = [];
        const errors: string[] = [];

        sheet.eachRow((row, rowNumber) => {
            // Skip header row and notes row
            if (rowNumber <= 1) return;

            const username = String(row.getCell(1).value || '').trim();
            const password = String(row.getCell(2).value || '').trim();

            // Skip empty rows or the notes row
            if (!username || !password || username.startsWith('←')) return;

            const label = String(row.getCell(3).value || '').trim() || undefined;
            const cityRaw = String(row.getCell(4).value || '').trim() || 'Jakarta';
            const latRaw = row.getCell(5).value;
            const lngRaw = row.getCell(6).value;
            const proxyUrl = String(row.getCell(7).value || '').trim() || undefined;

            // Resolve city coordinates
            const cityData = CITIES[cityRaw];
            const latitude = latRaw ? Number(latRaw) : (cityData?.lat ?? -6.2088);
            const longitude = lngRaw ? Number(lngRaw) : (cityData?.lng ?? 106.8456);

            rows.push({
                username,
                password,
                label,
                city: cityRaw,
                latitude,
                longitude,
                proxyUrl,
                isActive: true,
                _rowNumber: rowNumber,
            });
        });

        if (rows.length === 0) {
            throw new HttpException(
                'Tidak ada data valid ditemukan di file Excel',
                400,
            );
        }

        let imported = 0;

        for (const row of rows) {
            const rowNum = row._rowNumber;
            delete row._rowNumber;

            try {
                const validated = this.validationService.validate(
                    AccountValidation.CREATE,
                    row,
                );
                await this.prisma.account.create({ data: validated });
                imported++;
            } catch (err: any) {
                const msg = err?.message || 'Unknown error';
                errors.push(`Baris ${rowNum} (${row.username}): ${msg}`);
            }
        }

        this.logger.info(
            `Excel import: ${imported} imported, ${errors.length} failed`,
            { context: 'AccountService' },
        );

        return {
            imported,
            failed: errors.length,
            errors,
        };
    }
}
