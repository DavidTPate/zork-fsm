const Game = require('./lexGame');
const State = require('./state');
const Locale = require('./locales/locale-enUS');

function getLexTextResponse(text) {
    return {
        dialogAction: {
            type: 'Close',
            fulfillmentState: 'Fulfilled',
            message: {
                contentType: 'PlainText',
                content: text
            }
        }
    };
}

function handle(event, context, callback) {
    console.log(JSON.stringify(event, null, 2));

    return State.getState(event.userId)
        .then(userState => {
            return Game.handleResponseForCurrentState(userState, event.currentIntent)
                .then(response => {
                    return State.saveState(event.userId, userState).return(response);
                });
        })
        .then(response => {
            return callback(null, {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/xml'
                },
                body: getLexTextResponse(response)
            });
        })
        .catch(err => {
            console.error(err);
            return callback(null, {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/xml'
                },
                body: getLexTextResponse(Locale.globals.processingIssue)
            });
        });
}


module.exports = {
    handle: handle
};