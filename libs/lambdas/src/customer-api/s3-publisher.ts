import { PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import { PutObjectCommandInput, S3 } from '@aws-sdk/client-s3';

export const s3Publisher = async (
    request: PutEventsRequestEntry,
    bucketName: string,
    internalApiUrl: string,
    externalApiUrl: string,
) => {
    console.log(`Event to be Published:  ${JSON.stringify(request)} at ${bucketName}`);
    try {
        // Arrange: Prepopulate data
        if (!request.Detail) {
            throw new Error('Missing Event Detail');
        }
        const eventDetail = JSON.parse(request.Detail);
        const s3Key = `${request.Source}/${request.DetailType}/${eventDetail.Metadata.Guid}.json`;
        const putObjectParams: PutObjectCommandInput = {
            Bucket: bucketName,
            Key: s3Key,
            Body: JSON.stringify(eventDetail.Data),
            ContentType: 'application/json',
            ACL: 'bucket-owner-full-control',
        };
        // Act: Upload to S3 and return transformed request
        const client = new S3({ region: 'ap-southeast-2' });
        const result = await client.putObject(putObjectParams);
        console.log(`S3 Response: ${JSON.stringify(result)}`);

        request.Detail = JSON.stringify({
            Data: {
                _link: {
                    Internal: `${internalApiUrl}/events?s3Key=${s3Key}`,
                    External: `${externalApiUrl}/events?s3Key=${s3Key}`,
                },
            },
            Metadata: { ...eventDetail.Metadata, S3Bucket: bucketName, S3Key: s3Key },
        });
        console.log(`Updated Event Detail: ${JSON.stringify(request)}`);

        return request;
    } catch (error) {
        console.error(`Error creating S3 Object: ${error}`);
        throw new Error(`Error creating S3 Object: ${error}`);
    }
};
