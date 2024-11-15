import { MessageAttributeValue, SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { faker } from '@faker-js/faker';
import promptly from 'promptly';
import { z } from 'zod';
import { apps } from './apps';

const numberValidater = z.preprocess((input) => parseInt(z.string().parse(input), 10), z.number().positive());
const defaultQueue = 'https://sqs.ap-southeast-2.amazonaws.com/727026770742/EAI-EventBus-TargetDLQ-QA-NP';

export const eventFailures = async () => {
    console.log('Running simulation of event failures');

    if (!(await promptly.confirm('Are you signed in to the correct AWS workload?'))) return;

    const queueUrl = await promptly.prompt(`Which queue to pass failures to? (${defaultQueue})`, {
        default: defaultQueue,
    });
    const failureCount = await promptly.prompt('How many failures to simulate?: ', {
        validator: numberValidater.parse,
    });

    const client = new SQSClient({ region: 'ap-southeast-2' });
    const results = await Promise.allSettled(
        Array(failureCount)
            .fill(null)
            .map(() => {
                const app = faker.helpers.arrayElement(apps);

                const body = {
                    'detail-type': 'detail type',
                    id: 'id',
                    source: 'source',
                    time: new Date().toISOString(),
                };

                const attribrutes: Record<string, MessageAttributeValue> = {
                    TARGET_ARN: {
                        StringValue: `arn:aws:events:ap-southeast-2:144028967590:api-destination/${app.PK}.BECSRESTAPI.ApiDestination-PRD/7e08279e-244f-4443-a5f4-b9c262da4d81`,
                        DataType: 'String',
                    },
                    RULE_ARN: {
                        StringValue: `arn:aws:events:ap-southeast-2:144028967590:rule/EAI-EventBus-QA/${
                            app.PK
                        }.domain.subdomain.schema${faker.datatype.number(10)}`,
                        DataType: 'String',
                    },
                    ERROR_MESSAGE: {
                        StringValue: 'Error message',
                        DataType: 'String',
                    },
                    ERROR_CODE: {
                        StringValue: 'Error code',
                        DataType: 'String',
                    },
                    RETRY_ATTEMPTS: {
                        StringValue: faker.datatype.number({ min: 100, max: 200 }).toString(),
                        DataType: 'String',
                    },
                };

                return new SendMessageCommand({
                    QueueUrl: queueUrl,
                    MessageBody: JSON.stringify(body),
                    MessageAttributes: attribrutes,
                });
            })
            .map(async (message) => await client.send(message)),
    );

    const errors = results.filter((result) => result.status === 'rejected');

    if (errors.length > 0) {
        results.forEach((result) => console.log(result));
    } else {
        console.log(`Successfuly pushed all ${failureCount} event failures`);
    }
};
