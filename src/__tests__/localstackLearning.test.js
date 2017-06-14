import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import endpoints from './endpoints';

const s3 = new AWS.S3({
  s3ForcePathStyle: true,
  logger: console,
  endpoint: new AWS.Endpoint(endpoints.s3),
});

beforeEach(async () => {
  await s3.createBucket({ Bucket: 'test-bucket' }).promise();
  await s3
    .putObject({
      Bucket: 'test-bucket',
      Key: 'circle.png',
      ContentType: 'image/png',
      Body: fs.readFileSync(
        path.join(__dirname, '..', '..', 'fixtures', 'circle.png'),
      ),
    })
    .promise();
});

test('s3.getObject', async () => {
  const response = await s3
    .getObject({
      Bucket: 'test-bucket',
      Key: 'circle.png',
    })
    .promise();

  expect(response).toBeTruthy();
});
