import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class LogService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(page = 1, size = 20, accountId?: number) {
        const skip = (page - 1) * size;
        const where = accountId ? { accountId } : {};

        const [logs, total] = await Promise.all([
            this.prisma.workerLog.findMany({
                where,
                skip,
                take: size,
                orderBy: { createdAt: 'desc' },
                include: {
                    account: { select: { username: true, label: true } },
                },
            }),
            this.prisma.workerLog.count({ where }),
        ]);

        return {
            data: logs,
            paging: {
                currentPage: page,
                size,
                totalPage: Math.ceil(total / size),
            },
        };
    }

    async findByAccount(accountId: number, page = 1, size = 20) {
        return this.findAll(page, size, accountId);
    }

    async clearOldLogs(daysOld = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);

        const { count } = await this.prisma.workerLog.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });

        return { message: `Deleted ${count} old logs` };
    }
}
