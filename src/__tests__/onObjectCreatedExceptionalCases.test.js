import onObjectCreated from '../onObjectCreated';

describe('small sized test suite for exceptional cases', () => {
  test('file without extension', done => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: `test-bucket` },
            object: { key: `circle` },
          },
        },
      ],
    };

    onObjectCreated({
      s3: { getObject() {} },
      event,
      callback: (error, message) => {
        expect(error).toEqual('Could not determine the image type.');
        done();
      },
    });
  });

  test('extension is not ".png" nor ".jpg"', done => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: `test-bucket` },
            object: { key: `circle.txt` },
          },
        },
      ],
    };

    onObjectCreated({
      s3: { getObject() {} },
      event,
      callback: (error, message) => {
        expect(error).toEqual('Unsupported image type: txt');
        done();
      },
    });
  });
});
