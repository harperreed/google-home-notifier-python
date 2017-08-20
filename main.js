'use strict';

const express = require('express');
const googlehome = require('google-home-notifier');
const yaml = require('js-yaml');
const fs   = require('fs');


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
    logger.info("sending text notification to google home")
    googlehome.notify(text, function(res) {
        logger.debug(res);
    });  
};
 
var play = function(url, callback) { 
    logger.info("sending mp3 notification to google home")
    googlehome.play(url, function(res) {
        logger.debug(res);
    }); 
};
 

/* Grab Config */


// Get document, or throw exception on error
try {
  var notificationConfig = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
  
} catch (e) {
  winston.log('error', e);
}

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

    logger.info(notification)
    if (notification['voice-enabled']){
      if (notification['mp3']){
        var mp3_url = req.protocol + '://' + req.get('host') + "/" + notification['mp3']
        play(mp3_url)
      }else{
        logger.info("voice:" +  notification['voice'])
        speak(notification['voice'])
        }
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

app.use(express.static(__dirname + '/static'));

app.listen(PORT, HOST);
logger.info(`Running on http://${HOST}:${PORT}`);