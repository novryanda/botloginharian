import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // CORS for React frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Bull Board — queue monitoring UI
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const loginQueue = new Queue('login-worker', {
    connection: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
    },
  });

  createBullBoard({
    queues: [new BullMQAdapter(loginQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Backend running on http://localhost:${port}`);
  logger.log(`📊 Bull Board at http://localhost:${port}/admin/queues`);
}

bootstrap();
