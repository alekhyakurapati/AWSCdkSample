import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { AzureADGuard, Role, Roles, RolesGuard } from '@eai-event-integration-platform/api/auth';
import { DomainsService } from './domains.service';

@Controller('domains')
@Roles(Role.Viewer)
@UseGuards(AzureADGuard, RolesGuard)
export class DomainsController {
    private readonly logger = new Logger(DomainsController.name);

    constructor(private domainsService: DomainsService) {}

    @Get()
    async findBusinessDomains() {
        this.logger.debug('[findBusinessDomains]');
        try {
            this.logger.debug(`Finding business domains for wel`);
            return await this.domainsService.domains();
        } catch (error: any) {
            this.logger.error(`Error finding all business domains: ${error.message}`);
            throw error;
        }
    }

    @Get('/tree')
    async findBusinessDomainTree() {
        this.logger.debug('[findBusinessDomainTree]');
        try {
            this.logger.debug(`Finding business domain tree for wel`);
            return await this.domainsService.tree();
        } catch (error: any) {
            this.logger.error(`Error finding business domain tree: ${error.message}`);
            throw error;
        }
    }
}
