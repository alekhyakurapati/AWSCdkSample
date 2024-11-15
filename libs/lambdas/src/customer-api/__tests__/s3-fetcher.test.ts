import { GetObjectCommand, S3 } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@smithy/util-stream';
import { mockClient } from 'aws-sdk-client-mock';
import { s3Fetcher } from '../s3-fetcher';
import * as fs from 'fs';
import * as path from 'path';

const bucket = 'BUCKET';
const key = 'KEY';
const mocDataDir = '../../../../../data/customer-api/content/moc.json';

const s3Mock = mockClient(S3);

describe('Test for S3 data fetcher lambda', function () {
    beforeEach(() => s3Mock.reset());

    it('returns the expected data', async () => {
        const expected = fs.readFileSync(path.resolve(__dirname, mocDataDir)).toString();

        s3Mock.on(GetObjectCommand, { Bucket: bucket, Key: key }).resolves({
            Body: sdkStreamMixin(fs.createReadStream(path.resolve(__dirname, mocDataDir))),
        });

        const result = await s3Fetcher(key, bucket);
        expect(result).toEqual(expected);
    });
});
