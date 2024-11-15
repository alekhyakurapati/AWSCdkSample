/**
 * Main entry point to API application for lambda enviroments
 */
import { Logger } from '@aws-lambda-powertools/logger';
import { LogLevel } from '@aws-lambda-powertools/logger/lib/types';
import { LambdaLoggerService } from '@eai-event-integration-platform/api/utils';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import { Context, Handler } from 'aws-lambda';
import express from 'express';
import { AppModule } from './app/app.module';

let cachedServer: Handler;

const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'INFO';
const logger = new Logger({ serviceName: 'IntegrationHubApi', logLevel });

async function bootstrap() {
    if (!cachedServer) {
        const expressApp = express();
        const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

        nestApp.useLogger(new LambdaLoggerService(logger));

        nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));

        nestApp.enableCors();

        await nestApp.init();

        cachedServer = serverlessExpress({ app: expressApp });
    }

    return cachedServer;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any, context: Context, callback: any) => {
    logger.addContext(context);
    const server = await bootstrap();
    return server(event, context, callback);
};
