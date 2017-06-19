import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import { execSync } from 'child_process';
import onObjectCreated from '../onObjectCreated';

const branchName = execSync('git rev-parse --abbrev-ref @')
  .toString()
  .replace(/\n$/, '');

const s3 = new AWS.S3({
  logger: console,
});

throw new Error(
  'TODO: Prepare staging environment using cloudformation-template.yml',
);

describe('large sized test suite', () => {
  let count = 0;

  it('happy path', async () => {
    expect.assertions(1);
    const now = `${Date.now()}-${count++}`;
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: `test-bucket-${now}` },
            object: { key: `circle-${now}.png` },
          },
        },
      ],
    };

    await s3
      .putObject({
        Bucket: `test-${branchName}`,
        Key: `circle-${now}.png`,
        ContentType: 'image/png',
        Body: fs.readFileSync(
          path.join(__dirname, '..', '..', 'fixtures', 'circle.png'),
        ),
      })
      .promise();
    const data = await s3
      .waitFor('objectExists', {
        Bucket: `test-${branchName}resized`,
        Key: `resized-circle-${now}.png`,
      })
      .promise();

    expect(data).toBeTruthy();
  });
});
