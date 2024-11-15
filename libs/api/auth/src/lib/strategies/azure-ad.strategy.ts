import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';
import { AuthUser } from '../auth-user';

@Injectable()
export class AzureADStrategy extends PassportStrategy(BearerStrategy, 'azure-ad') {
    constructor(private configService: ConfigService) {
        super({
            // prettier-ignore
            identityMetadata: `https://login.microsoftonline.com/${configService.get('AZURE_TENANT_ID')}/v2.0/.well-known/openid-configuration`,
            clientID: configService.get('AZURE_CLIENT_ID'),
        });
    }

    async validate(payload: any): Promise<AuthUser> {
        return {
            name: payload.name,
            username: payload.preferred_username,
            roles: payload.roles,
        };
    }
}
