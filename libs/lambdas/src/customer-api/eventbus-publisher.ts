import { EventBridge, PutEventsCommandInput, PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';

export const eventBusPublisher = async (event: PutEventsRequestEntry) => {
    console.log(`Eventbus request: ${JSON.stringify(event)}`);
    const putEventParams: PutEventsCommandInput = {
        Entries: [event],
    };
    try {
        const client = new EventBridge({ region: 'ap-southeast-2' });
        const result = await client.putEvents(putEventParams);
        console.log(`Eventbridge reponse: ${JSON.stringify(result)}`);

        // EventBridge will send a 200 response even if some of the events failed to get processed.
        // https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_PutEvents.html
        // Since we're only posting 1 event at a time, we want to check if it failed or not and
        // return a proper status code back to the client

        if ((result.FailedEntryCount && result.FailedEntryCount > 0) || !result.Entries) {
            // extract the error message from the Entries array and throw
            const error = result.Entries ? (result.Entries[0].ErrorMessage as string) : '';
            throw new Error(error);
        }

        return result.Entries[0];
    } catch (error) {
        console.error(`Error putting event: ${error}`);
        throw new Error(`Error putting event: ${error}`);
    }
};
