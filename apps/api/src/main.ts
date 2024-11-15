/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { LocalLoggerService } from '@eai-event-integration-platform/api/utils';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useLogger(new LocalLoggerService('IntegrationHubApi', { logLevels: ['log', 'error', 'warn', 'debug'] }));

    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    const port = process.env.PORT || 3333;
    await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
