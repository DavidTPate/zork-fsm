const querystring = require('querystring');
const Game = require('./game');
const State = require('./state');
const Locale = require('./locales/locale-enUS');

function getTwilioResponse(message) {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${message}</Message>
</Response>
`;
}

function handle(event, context, callback) {
    const payload = querystring.parse(event.body);
    console.log(JSON.stringify(payload, null, 2));

    return State.getState(payload.From)
        .then(userState => {
            return Game.handleResponseForCurrentState(userState, payload.Body)
                .then(response => {
                    return State.saveState(payload.From, userState).return(response);
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
                body: getTwilioResponse(Locale.globals.processingIssue)
            });
        });
}


module.exports = {
    handle: handle
};