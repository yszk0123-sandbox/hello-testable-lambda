import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import endpoints from './endpoints';
import onObjectCreated from '../onObjectCreated';

const s3 = new AWS.S3({
  s3ForcePathStyle: true,
  logger: console,
  endpoint: new AWS.Endpoint(endpoints.s3),
});

describe('localstack based test suite for happy path cases', () => {
  let now, event;
  let count = 0;
  beforeEach(async () => {
    now = `${Date.now()}-${count++}`;
    event = {
      Records: [
        {
          s3: {
            bucket: { name: `test-bucket-${now}` },
            object: { key: `circle-${now}.png` },
          },
        },
      ],
    };
    await s3.createBucket({ Bucket: `test-bucket-${now}` }).promise();
    await s3.createBucket({ Bucket: `test-bucket-${now}resized` }).promise();
    await s3
      .putObject({
        Bucket: `test-bucket-${now}`,
        Key: `circle-${now}.png`,
        ContentType: 'image/png',
        Body: fs.readFileSync(
          path.join(__dirname, '..', '..', 'fixtures', 'circle.png'),
        ),
      })
      .promise();
  });

  it('onObjectCreatd calls callback with message', async () => {
    expect.assertions(1);
    const message = await new Promise((resolve, reject) => {
      const callback = (error, message) =>
        error ? reject(error) : resolve(message);

      onObjectCreated({ s3, event, callback });
    });

    expect(message).toMatch(/^message/);
  });

  it('onObjectCreated creates and puts thumbnail into destination bucket', async () => {
    expect.assertions(1);
    const message = await new Promise((resolve, reject) => {
      const callback = (error, message) =>
        error ? reject(error) : resolve(message);

      onObjectCreated({ s3, event, callback });
    });

    const data = await s3
      .waitFor('objectExists', {
        Bucket: `test-bucket-${now}resized`,
        Key: `resized-circle-${now}.png`,
      })
      .promise();

    expect(data).toBeTruthy();
  });
});
