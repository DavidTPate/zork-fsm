'use strict';
const querystring = require('querystring');
const Promise = require('bluebird');
const locale = require('./lib/locales/locale-enUS');
const S3FS = require('s3fs');
const fs = new S3FS(process.env.STATE_BUCKET_NAME, {
    region: process.env.AWS_REGION
});

module.exports.hello = (event, context, callback) => {
    const payload = querystring.parse(event.body);
    console.log(JSON.stringify(payload, null, 2));

    return loadState(payload.From)
        .then(userState => {
            return handleResponseForCurrentState(userState, payload.Body)
                .then(response => {
                    return storeState(payload.From, userState).return(response);
                });
        })
        .then(response => {
            return callback(null, {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/xml'
                },
                body: getTwilioResponse(response)
            });
        })
        .catch(err => {
            console.error(err);
            return callback(null, {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/xml'
                },
                body: getTwilioResponse('There was an issue processing your request, please try again later.')
            });
        });
};
