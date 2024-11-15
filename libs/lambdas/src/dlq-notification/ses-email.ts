import { SES } from '@aws-sdk/client-ses';
import { STS } from '@aws-sdk/client-sts';
import { logger } from '.';

export async function sesSendEmail(
    SESRole: string,
    emailData: string,
    recipientEmails: string[],
    subscriberApp: string,
) {
    const assumedSESRole = await new STS({ region: 'ap-southeast-2' }).assumeRole({
        RoleArn: SESRole,
        RoleSessionName: 'SES-SendEmail-Prod',
    });

    if (
        !assumedSESRole.Credentials?.AccessKeyId ||
        !assumedSESRole.Credentials?.SecretAccessKey ||
        !assumedSESRole.Credentials?.SessionToken
    ) {
        throw new Error('Failed to assume role');
    }

    const ses = new SES({
        credentials: {
            accessKeyId: assumedSESRole.Credentials.AccessKeyId,
            secretAccessKey: assumedSESRole.Credentials.SecretAccessKey,
            sessionToken: assumedSESRole.Credentials.SessionToken,
        },
        region: 'ap-southeast-2',
    });

    logger.info('Recipient Emails', { recipientEmails });

    const integrationTeam = process.env.INTEGRATION_TEAM_EMAIL?.split('; ') ?? [''];

    return await ses.sendEmail({
        Destination: {
            ToAddresses: recipientEmails,
            BccAddresses: integrationTeam,
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: emailData,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: `Alert! ${subscriberApp} - Event delivery failure(s) - Integration Hub`,
            },
        },
        Source: 'noreplyintegrationhub@woodside.com.au',
    });
}
