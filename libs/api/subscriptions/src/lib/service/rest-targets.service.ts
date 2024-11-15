import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Request } from 'express';
import { BrokerTypes, Connection, Destination } from '@eai-event-integration-platform/interfaces';
import { CreateConnectionDto, CreateDestinationDto, UpdateConnectionDto, UpdateDestinationDto } from '../dto/';
import { RestTargetsInfrastructure } from '../infrastructure/rest-targets.infrastructure';
import { RestTargetsRepository } from '../repository/rest-targets.repository';
import { AwsService } from '@eai-event-integration-platform/api/aws';
import { ConfigService } from '@nestjs/config';
import { AuthUser } from '@eai-event-integration-platform/api/auth';

@Injectable()
export class RestTargetsService {
    private readonly logger = new Logger(RestTargetsService.name);

    constructor(
        @Inject(REQUEST) private request: Request,
        private configService: ConfigService,
        private awsService: AwsService,
        private restTargetsInfrastructure: RestTargetsInfrastructure,
        private restTargetsRepository: RestTargetsRepository,
    ) {}

    async createConnection(createConnectionDto: CreateConnectionDto): Promise<Connection> {
        this.logger.debug('[createConnection]');

        await this.checkEnvironment(createConnectionDto.Broker);
        const connectionResult = await this.restTargetsInfrastructure.createConnection(createConnectionDto);

        // add entry to DDB
        await this.restTargetsRepository.createConnection(connectionResult);

        return connectionResult;
    }

    async updateConnection(updateConnectionDto: UpdateConnectionDto): Promise<Connection> {
        this.logger.debug('[updateConnection]');

        await this.checkEnvironment(updateConnectionDto.Broker);
        const connectionResult = await this.restTargetsInfrastructure.updateConnection(updateConnectionDto);

        // add entry to DDB
        await this.restTargetsRepository.updateConnection(connectionResult);

        return connectionResult;
    }

    async createDestination(createDestinationDto: CreateDestinationDto): Promise<Destination> {
        this.logger.debug('[createDestination]');

        await this.checkEnvironment(createDestinationDto.Broker);

        const connectionResult = await this.getConnection(createDestinationDto.ConnectionName);
        const destResult = await this.restTargetsInfrastructure.createDestination(
            createDestinationDto,
            connectionResult.ConnectionArn || '',
        );
        // add entry to DDB
        await this.restTargetsRepository.createDestination(destResult, createDestinationDto.ConnectionName);
        return destResult;
    }

    async updateDestination(orignalConName: string, updateDestinationDto: UpdateDestinationDto): Promise<Destination> {
        this.logger.debug('[updateDestination]');

        await this.checkEnvironment(updateDestinationDto.Broker);

        const updateConnectionResult = await this.getConnection(updateDestinationDto.ConnectionName);
        const destinationResult = await this.restTargetsInfrastructure.updateDestination(
            updateDestinationDto,
            updateConnectionResult.ConnectionArn || '',
        );

        // add entry to DDB
        await this.restTargetsRepository.updateDestination(updateConnectionResult, destinationResult);
        if (orignalConName !== updateDestinationDto.ConnectionName) {
            await this.restTargetsRepository.deleteDestination(orignalConName, updateDestinationDto.DestinationName);
        }
        return destinationResult;
    }

    async getAllSwitch(type: 'Connection' | 'Destination', userOwned?: boolean): Promise<Connection[] | Destination[]> {
        this.logger.debug(`[getAll'${type}s'`);
        const user = this.request.user as AuthUser;
        const roles = user.roles.filter((r) => r.startsWith('Event.User'));
        const allItemsType = await this.restTargetsRepository.getAll(type);
        const filteredItems: any = [];
        if (userOwned) {
            this.logger.log(`Getting ${type}s for logged in user`);
            allItemsType.map((itemType) => {
                if (roles.includes(itemType.OwnerRole || '')) {
                    filteredItems.push(itemType);
                }
            });
            return filteredItems;
        }

        this.logger.log(`Getting all ${type}s`);
        return allItemsType;
    }

    async getConnection(conName: string): Promise<Connection> {
        this.logger.debug('[getConnection]');
        return this.restTargetsRepository.getConnection(conName);
    }

    async getConnectionAuthStatus(conName: string) {
        this.logger.debug('[getConnectionAuthStatus]');
        const broker = conName.split('-').slice(-1)[0] === 'NP' ? BrokerTypes.NP : BrokerTypes.PRD;
        await this.checkEnvironment(broker);
        return this.restTargetsInfrastructure.getConnectionAuthStatus(conName);
    }

    async getDestinations(conName: string, destName?: string): Promise<Destination[]> {
        this.logger.debug('[getDestinations]');
        const destinationsResult = await this.restTargetsRepository.getDestinations(conName);
        if (!destinationsResult) {
            throw new NotFoundException(`Destinations for connection '${conName}' not found`);
        }
        if (destName) {
            return destinationsResult.filter((destination) => {
                return destination.DestinationName === destName;
            });
        }
        return destinationsResult;
    }

    async deleteConnection(conName: string) {
        const broker = conName.split('-').slice(-1)[0] === 'NP' ? BrokerTypes.NP : BrokerTypes.PRD;
        await this.checkEnvironment(broker);

        await this.restTargetsInfrastructure.deleteConnection(conName);

        // now delete from, the database
        await this.restTargetsRepository.deleteConnection(conName);

        // may need better response message
        return { message: 'Successfully Deleted Connection' };
    }

    async deleteDestination(conName: string, destName: string) {
        const broker = destName.split('-').slice(-1)[0] === 'NP' ? BrokerTypes.NP : BrokerTypes.PRD;
        await this.checkEnvironment(broker);

        await this.restTargetsInfrastructure.deleteDestination(destName);

        // now delete from, the database
        await this.restTargetsRepository.deleteDestination(conName, destName);

        // may need better response message
        return { message: 'Successfully Deleted Destination' };
    }

    private async checkEnvironment(broker: BrokerTypes) {
        this.logger.debug('[checkEnvironment]');
        const env = this.configService.getOrThrow('NODE_ENV');
        if ((env === 'production' || env === 'qa') && broker === BrokerTypes.NP) {
            // nonProd broker being requested, need to assume new role for non-prod aws account
            await this.setNpEventBridgeClient();
        }
    }

    private async setNpEventBridgeClient() {
        this.logger.debug('[setNpEventBridgeClient]');
        try {
            const creds = await this.awsService.assumeNonProdRole();

            this.restTargetsInfrastructure.eventBridge = new EventBridge({
                region: 'ap-southeast-2',
                credentials: {
                    accessKeyId: creds.AccessKeyId + '',
                    secretAccessKey: creds.SecretAccessKey + '',
                    sessionToken: creds.SessionToken,
                },
            });
        } catch (error: any) {
            this.logger.error(`Error trying to set EventBridgeClient to assume NonProd Role: ${error.message}`);
            throw error;
        }
    }

    async permissionCheck(conName: string, currentUser: AuthUser, destName?: string, del?: boolean) {
        this.logger.debug('[permissionCheck]');
        let existingOwnerRole = '';
        if (destName) {
            existingOwnerRole = (await this.getDestinations(conName, destName))[0].OwnerRole || '';
        } else {
            if (del) {
                const existingConnection = await this.getDestinations(conName);
                if (existingConnection && existingConnection.length > 0) {
                    throw new BadRequestException(`${conName} has existing destinations and cannot be deleted`);
                }
            }
            existingOwnerRole = (await this.getConnection(conName)).OwnerRole || '';
        }
        // TODO: see if there is a better way to do this with existing route guards
        if (!currentUser.roles.includes(existingOwnerRole + '')) {
            this.logger.warn(`User with role ${currentUser.roles} not allowed to update schema ${conName}`);
            throw new ForbiddenException(
                'Forbidden, user does not have the necessary role to perform create, read or delete operations',
            );
        }
    }
}
