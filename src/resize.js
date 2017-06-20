import async from 'async';

const MAX_WIDTH = 100;
const MAX_HEIGHT = 100;

export default function resize({
  s3,
  gm,
  srcBucket,
  srcKey,
  dstBucket,
  dstKey,
  callback,
}) {
  // Sanity check: validate that source and destination are different buckets.
  if (srcBucket == dstBucket) {
    callback('Source and destination buckets are the same.');
    return;
  }

  // Infer the image type.
  const typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    callback('Could not determine the image type.');
    return;
  }
  const imageType = typeMatch[1];
  if (imageType != 'jpg' && imageType != 'png') {
    callback(`Unsupported image type: ${imageType}`);
    return;
  }

  // Download the image from S3, transform, and upload to a different S3 bucket.
  async.waterfall(
    [
      function download(next) {
        // Download the image from S3 into a buffer.
        s3.getObject(
          {
            Bucket: srcBucket,
            Key: srcKey,
          },
          next,
        );
      },
      function transform(response, next) {
        gm(response.Body).size(function(err, size) {
          // Infer the scaling factor to avoid stretching the image unnaturally.
          const scalingFactor = Math.min(
            MAX_WIDTH / size.width,
            MAX_HEIGHT / size.height,
          );
          const width = scalingFactor * size.width;
          const height = scalingFactor * size.height;

          // Transform the image buffer in memory.
          this.resize(width, height).toBuffer(imageType, function(err, buffer) {
            if (err) {
              next(err);
            } else {
              next(null, response.ContentType, buffer);
            }
          });
        });
      },
      function upload(contentType, data, next) {
        // Stream the transformed image to a different S3 bucket.
        s3.putObject(
          {
            Bucket: dstBucket,
            Key: dstKey,
            Body: data,
            ContentType: contentType,
          },
          next,
        );
      },
    ],
    function(err) {
      if (err) {
        console.error(
          'Unable to resize ' +
            srcBucket +
            '/' +
            srcKey +
            ' and upload to ' +
            dstBucket +
            '/' +
            dstKey +
            ' due to an error: ' +
            err,
        );
      } else {
        console.log(
          'Successfully resized ' +
            srcBucket +
            '/' +
            srcKey +
            ' and uploaded to ' +
            dstBucket +
            '/' +
            dstKey,
        );
      }

      callback(null, 'message');
    },
  );
}
