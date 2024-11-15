import { APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) => {
    console.log(event, 'Event Received');

    return { statusCode: 200 };
};
