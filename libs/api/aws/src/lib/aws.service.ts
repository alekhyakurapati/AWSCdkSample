import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Credentials, STS } from '@aws-sdk/client-sts';

@Injectable()
export class AwsService {
    private readonly logger = new Logger(AwsService.name);

    constructor(private config: ConfigService, private sts: STS) {}

    async assumeNonProdRole(): Promise<Credentials> {
        this.logger.debug('[assumeNonProdRole]');

        this.logger.log(`Assuming role for NonProd Account`);
        const roleArn = this.config.getOrThrow<string>('ASSUME_NP_ROLE_ARN');
        if (!roleArn) {
            throw new HttpException(
                'No RoleArn provided to assume role for config var ASSUME_NP_ROLE_ARN',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
        // get the credentials to assume role in the NP account
        const npAcc = await this.sts.assumeRole({
            RoleArn: roleArn,
            RoleSessionName: 'np-role',
        });

        const ACCESS_KEY = npAcc.Credentials?.AccessKeyId;
        const SECRET_KEY = npAcc.Credentials?.SecretAccessKey;
        const SESSION_TOKEN = npAcc.Credentials?.SessionToken;

        if (!npAcc.Credentials || !ACCESS_KEY || !SECRET_KEY || !SESSION_TOKEN) {
            throw new HttpException('Error assuming role, invalid credential values', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return npAcc.Credentials;
    }
}
