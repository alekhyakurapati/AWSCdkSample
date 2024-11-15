import { REQUEST } from '@nestjs/core';
import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Request } from 'express';

import { AuthUser } from '@eai-event-integration-platform/api/auth';
import {
    Application,
    ApplicationAwsAccounts,
    ApplicationAwsAccountDetails,
} from '@eai-event-integration-platform/interfaces';
import { SchemasService } from '@eai-event-integration-platform/api/schemas';
import { SubscriptionsService } from '@eai-event-integration-platform/api/subscriptions';

import { CreateApplicationDto, UpdateApplicationDto } from './dto';
import { ApplicationsRepository } from './applications.repository';

@Injectable()
export class ApplicationsService {
    private readonly logger = new Logger(ApplicationsService.name);

    constructor(
        @Inject(REQUEST) private request: Request,
        private applicationsRepository: ApplicationsRepository,
        private schemasService: SchemasService,
        private subscriptionsService: SubscriptionsService,
    ) {}

    /**
     * List applications from application table
     */
    async getApplication(name: string): Promise<Application> {
        // setup input
        this.logger.debug('[getApplication]');
        const application = await this.applicationsRepository.getApplication(name);
        if (!application) {
            throw new NotFoundException(`Application '${name}' not found`);
        }
        return application;
    }

    async listApplications(userOwned?: boolean): Promise<Application[]> {
        if (userOwned) {
            this.logger.log(`Listing all user owned applications`);
            return await this.listUserOwnedApplications();
        }
        this.logger.log(`Listing all applications`);
        return await this.listAllApplications();
    }

    async listUserOwnedApplications(): Promise<Application[]> {
        this.logger.debug('[listUserOwnedApplications]');
        const user = this.request.user as AuthUser;
        const roles = user.roles.filter((r) => r.startsWith('Event.User'));
        return this.applicationsRepository.findAllApplicationsByUserRoles(roles);
    }

    async listAllApplications(): Promise<Application[]> {
        this.logger.debug('[listAllApplications]');
        return this.applicationsRepository.findAllApplications();
    }

    async deleteApplication(name: string) {
        this.logger.debug('[deleteApplication');
        return await this.applicationsRepository.deleteApplication(name);
    }

    async createApplication(createApplicationDto: CreateApplicationDto) {
        this.logger.debug('[createApplication]');
        const awsAccounts: ApplicationAwsAccounts = this.getAwsDetails(createApplicationDto);
        return await this.applicationsRepository.createApplication(createApplicationDto, awsAccounts);
    }

    async updateApplication(updateApplicationDto: UpdateApplicationDto) {
        this.logger.debug('[updateApplication]');
        try {
            const awsAccounts: ApplicationAwsAccounts = this.getAwsDetails(updateApplicationDto);
            const updateApplicationResult = await this.applicationsRepository.updateApplication(
                updateApplicationDto,
                awsAccounts,
            );
            this.logger.debug(updateApplicationResult.message);
            const syncApplicationToSchemasResult = await this.schemasService.syncApplicationToSchemas(
                updateApplicationDto,
            );
            this.logger.debug(syncApplicationToSchemasResult.message);
            const syncApplicationToSubscriptionsResult = await this.subscriptionsService.syncApplicationToSubscriptions(
                updateApplicationDto,
            );
            this.logger.debug(syncApplicationToSubscriptionsResult.message);
            return { message: `Successfully Updated and Synced Application: ${updateApplicationDto.ShortName}` };
        } catch (error) {
            this.logger.error(`Error updating application: ${error}`);
            throw new InternalServerErrorException(error);
        }
    }

    getAwsDetails(application: CreateApplicationDto | UpdateApplicationDto): ApplicationAwsAccounts {
        const awsDetails: ApplicationAwsAccounts = {};
        const awsDetailsNP: ApplicationAwsAccountDetails = {};
        const awsDetailsPRD: ApplicationAwsAccountDetails = {};
        if (application.AwsAccountNameNP) {
            awsDetailsNP.Name = application.AwsAccountNameNP;
        }
        if (application.AwsAccountNumberNP) {
            awsDetailsNP.Number = application.AwsAccountNumberNP;
        }
        if (application.AwsAccountNamePRD) {
            awsDetailsPRD.Name = application.AwsAccountNamePRD;
        }
        if (application.AwsAccountNumberPRD) {
            awsDetailsPRD.Number = application.AwsAccountNumberPRD;
        }
        if (Object.keys(awsDetailsNP).length !== 0) {
            awsDetails.NP = awsDetailsNP;
        }
        if (Object.keys(awsDetailsPRD).length !== 0) {
            awsDetails.PRD = awsDetailsPRD;
        }
        return awsDetails;
    }
}
