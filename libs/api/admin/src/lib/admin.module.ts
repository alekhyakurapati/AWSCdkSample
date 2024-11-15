import { Module } from '@nestjs/common';

import { AwsModule } from '@eai-event-integration-platform/api/aws';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
    imports: [AwsModule],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
