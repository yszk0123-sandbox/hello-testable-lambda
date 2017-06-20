const gm = require('gm').subClass({ imageMagick: true }); // Enable ImageMagick integration.
import util from 'util';
import resize from './resize';

module.exports = async function({ s3, event, callback }) {
  // Read options from the event.
  console.log(
    'Reading options from event:\n',
    util.inspect(event, { depth: 5 }),
  );
  const srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  const srcKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' '),
  );
  const dstBucket = srcBucket + 'resized';
  const dstKey = 'resized-' + srcKey;

  try {
    const message = await resize({
      s3,
      gm,
      srcBucket,
      srcKey,
      dstBucket,
      dstKey,
    });
    callback(null, message);
  } catch (error) {
    callback(error);
  }
};
