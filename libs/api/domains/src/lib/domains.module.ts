import { Module } from '@nestjs/common';

import { AwsModule } from '@eai-event-integration-platform/api/aws';

import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';

@Module({
    imports: [AwsModule],
    controllers: [DomainsController],
    providers: [DomainsService],
    exports: [DomainsService],
})
export class DomainsModule {}
