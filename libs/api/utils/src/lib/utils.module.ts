import { Module } from '@nestjs/common';
import { LambdaLoggerService } from './lambda-logger.service';
import { LocalLoggerService } from './local-logger.service';

@Module({
    providers: [LambdaLoggerService, LocalLoggerService],
    exports: [LambdaLoggerService, LocalLoggerService],
})
export class UtilsModule {}
