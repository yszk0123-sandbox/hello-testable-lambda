var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var onObjectCreated = require('./onObjectCreated');

exports.handler = function(event, context, callback) {
  onObjectCreated({ s3, event, callback });
};
