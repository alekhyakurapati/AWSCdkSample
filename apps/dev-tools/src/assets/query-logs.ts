import {
    CloudWatchLogsClient,
    GetQueryResultsCommand,
    StartQueryCommand,
    StopQueryCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { DateTime } from 'luxon';

const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const eventSource = 'wel.operations.maintenance';
const eventName = 'MaintenanceOrderChanged';

const fields = '@timestamp, @message, @logStream';
const filter = `level="DEBUG" and event.source="${eventSource}" and \`event.detail-type\`="${eventName}"`;
const sort = '@timestamp desc ';
const display = '@timestamp, event.source, `event.detail-type`, event.detail.Metadata.Version, @message, @logStream';

const hours = 12;
const limit = 10;

export const queryLogs = async () => {
    console.log('Querying CloudWatch logs');
    try {
        const client = new CloudWatchLogsClient({ region: 'ap-southeast-2' });

        // Create query
        const now = DateTime.now();
        const queryParams = {
            logGroupName: '/aws/lambda/EAI-EventBroker-EventLogger-PRD',
            startTime: now.minus({ hours }).toUnixInteger(),
            endTime: now.toUnixInteger(),
            queryString: `fields ${fields}| filter ${filter} | sort ${sort} | display ${display}`,
            limit,
        };
        const startCommand = new StartQueryCommand(queryParams);
        const startResponse = await client.send(startCommand);

        // Get query results
        const input = {
            queryId: startResponse.queryId,
        };
        const queryCommand = new GetQueryResultsCommand(input);
        let queryResponse = await client.send(queryCommand);

        // Poll query results
        while (queryResponse.results.length < limit && queryResponse.status === 'Running') {
            await sleep(1000);
            queryResponse = await client.send(queryCommand);
        }

        // Stop query early if limit is already filled
        if (queryResponse.results.length >= limit) {
            const stopCommand = new StopQueryCommand(input);
            await client.send(stopCommand);
        }

        queryResponse.results
            ?.flatMap((entry) => entry.filter(({ field }) => field === '@message'))
            .map(({ value }) => JSON.parse(value).event)
            .forEach((log) => console.log(log));
    } catch (error) {
        console.log(error);
    }
};
