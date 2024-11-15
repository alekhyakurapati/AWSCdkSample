import { EventBridgeEvent } from 'aws-lambda';
import { handler } from './event-logger';

describe('Tests event-logger', function () {
    it('verifies successful response', async () => {
        const mockEvent: EventBridgeEvent<string, any> = {
            id: '123',
            version: '1',
            account: '123456789',
            time: new Date().toISOString(),
            region: 'ap-southeast-2',
            resources: [],
            source: 'wel.test',
            'detail-type': 'TestEvent',
            detail: {
                key1: 'value1',
            },
        };
        const result = await handler(mockEvent, {});
        console.log('result', result);

        expect(result.statusCode).toEqual(200);
    });
});
