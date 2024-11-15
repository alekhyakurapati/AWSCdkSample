import { BaseExceptionFilter } from '@nestjs/core';
import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { SchemasServiceException } from '@aws-sdk/client-schemas';
import { DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { EventBridgeServiceException } from '@aws-sdk/client-eventbridge';
import { Response } from 'express';

@Catch()
export class AwsExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(AwsExceptionFilter.name);

    override catch(e: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (
            e instanceof SchemasServiceException ||
            e instanceof DynamoDBServiceException ||
            e instanceof EventBridgeServiceException // TODO: must be a better way
        ) {
            this.logger.error(`AWS Service Error caught: ${e.message} \n ${JSON.stringify(e)}`);
            const status = e.$metadata.httpStatusCode || 500;
            response.status(status).json({
                message: e.message,
                error: e.name,
                statusCode: status,
            });
        } else {
            this.logger.error(`Error caught ${(e as Error).toString()}`, (e as Error).stack);
            super.catch(e, host);
        }
    }
}
