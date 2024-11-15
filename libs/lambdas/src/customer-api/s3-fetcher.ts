import { GetObjectCommand, GetObjectCommandInput, S3, S3Client } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@smithy/util-stream';

export const s3Fetcher = async (s3Key: string, bucketName: string) => {
    const bucketParams: GetObjectCommandInput = {
        Bucket: bucketName,
        Key: s3Key,
    };

    console.log(`Event to be Fetched: ${bucketParams.Key} in bucket ${bucketParams.Bucket}`);

    const client = new S3({ region: 'ap-southeast-2' });
    const { Body } = await client.send(new GetObjectCommand(bucketParams));
    const objectString = await sdkStreamMixin(Body).transformToString();

    return objectString;
};
