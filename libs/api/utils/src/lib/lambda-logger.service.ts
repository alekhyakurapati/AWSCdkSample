import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';
import { Logger as PowertoolsLogger } from '@aws-lambda-powertools/logger';

@Injectable({ scope: Scope.TRANSIENT })
export class LambdaLoggerService extends ConsoleLogger {
    constructor(private logger: PowertoolsLogger) {
        super();
    }

    // Overwriting the default Nest Logger class methods
    override log(message: string, context?: string) {
        this.logger.info(message, { context });
    }

    override error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { context, trace });
    }

    override warn(message: string, context?: string) {
        this.logger.warn(message, { context });
    }

    override debug(message: string, context?: string) {
        this.logger.debug(message, { context });
    }

    override verbose(message: string, context?: string) {
        this.logger.debug(message, { context });
    }
}
