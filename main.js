'use strict';

const express = require('express');
const googlehome = require('google-home-notifier');
const yaml = require('js-yaml');
const fs   = require('fs');
const twilio = require('twilio');
const AWS = require('aws-sdk');
const request = require('request');
const moment = require('moment');
const winston = require('winston')

/* set up logging */

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: function() {
        return "[" + moment().format('MMM D YYYY HH:mm:ss') + "]";
      },
      formatter: function(options) {
        // Return string will be passed to logger.
        return options.timestamp() +' '+ options.level.toUpperCase() +' - '+ (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
      }
    })
  ]
});

/* FUNCTION */

var speak = function(text, callback) { 
    logger.info("sending notification to google home")
    googlehome.notify(text, function(res) {
        logger.debug(res);
    });  
};
 

var text = function(text, callback) { 
    logger.info("sending sms")
    notificationConfig['targets']['phones'].forEach(function(to_number) {
        client.messages.create({
            body: text,
            to: to_number,  // Text this number
            from: notificationConfig['credentials']['twilio']['from'] // From a valid Twilio number
        })
        .then((message) => logger.debug(message.sid));   
    });    
};

var mms = function(text, mediaUrl, callback) { 
    logger.info("sending mms")
    notificationConfig['targets']['phones'].forEach(function(to_number) {
        client.messages.create({
            body: text,
            to: to_number,  // Text this number
            mediaUrl: mediaUrl,
            from: notificationConfig['credentials']['twilio']['from'] // From a valid Twilio number

        })
        .then((message) => logger.debug(message.sid));   
    });    
};

var put_from_url = function(url, bucket, key, callback) {
    logger.debug("uploading url: " + url + " to " + bucket + " as " + key)
    request({
        url: url,
        encoding: null
    }, function(err, res, body) {
        if (err)
            return callback(err, res);

        s3.putObject({
            Bucket: bucket,
            Key: key,
            ContentType: res.headers['content-type'],
            ContentLength: res.headers['content-length'],
            Body: body // buffer
        }, callback);
    })
}

var grabSnapshot = function(cameraName){
    logger.info("Sending snapshot")
    var now = moment();
    var timestamp = now.format("X")

    var camera = notificationConfig['cameras'][cameraName]
    var bucket = notificationConfig['credentials']['aws']['bucket']
    var key = cameraName + '/'+ timestamp +'.png'
    const signedUrlExpireSeconds = 60 * 5

    logger.debug("uploading to s3")
    put_from_url(camera['url'], bucket, key, function(err, res) {
        if (err) {
            winston.log('error',"Error downloading or saving to s3")
            return
        }
        logger.debug("generate url from s3")
        const url = s3.getSignedUrl('getObject', {
            Bucket: bucket,
            Key: key,
            Expires: signedUrlExpireSeconds
        })
        var message = " 📷 " + camera["title"] + " @ " + now.format('h:mm a on ddd, MMM D')
        logger.debug("sending snapshot with message: " + message)
        logger.debug("sending mms")
        mms(message, url)
    });

    



}

/* Grab Config */


// Get document, or throw exception on error
try {
  var notificationConfig = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
  
} catch (e) {
  winston.log('error', e);
}


/* Let's instantiate some good things */


var client = new twilio(notificationConfig['credentials']['twilio']['accountSid'], notificationConfig['credentials']['twilio']['authToken']);


AWS.credentials = new AWS.Credentials();
AWS.credentials.accessKeyId = notificationConfig['credentials']['aws']['accessKeyId'];
AWS.credentials.secretAccessKey = notificationConfig['credentials']['aws']['secretAccessKey'];

AWS.config = new AWS.Config();
AWS.config.region = notificationConfig['credentials']['aws']['region'];

var s3 = new AWS.S3();

/* Set up google home */


googlehome.device('Google-Home'); // Change to your Google Home name


/* Config Web */

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (req, res) => {
  res.send('NaN\n');

});


app.get('/notifi/:notificationId', (req, res) => {
    
   
    var notificationId = req.params['notificationId']
    var notification = notificationConfig['notifications'][notificationId];

    if (notification['text-enabled']){
        logger.info("text:" +  notification['text'])
        text(notification['text'])
    }

    if (notification['voice-enabled']){
        logger.info("voice:" +  notification['voice'])
        speak(notification['voice'])
    }


    if (notification['snapshot']){
        logger.info("Sending a snapshot: " + notification['camera'])
        
        grabSnapshot(notification['camera']);

    }

    res.send(notificationId);
 
});


app.get('/reload', (req, res) => {
// Get document, or throw exception on error
    try {
    notificationConfig = yaml.safeLoad(fs.readFileSync('sample_document.yml', 'utf8'));
  
    } catch (e) {
        logger.info(e);
    }
    res.send('Configuration reloaded\n');
});

app.listen(PORT, HOST);
logger.info(`Running on http://${HOST}:${PORT}`);