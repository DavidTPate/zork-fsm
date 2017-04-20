'use strict';
const querystring = require('querystring');
const inquirer = require('inquirer');
const Promise = require('bluebird');
const locale = require('./locale-enUS');
const S3FS = require('s3fs');
const fs = new S3FS(process.env.STATE_BUCKET_NAME, {
    region: process.env.AWS_REGION
});

function getTwilioResponse(message) {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${message}</Message>
</Response>
`;
}

const globalActions = [
    {
        matcher: /(?:help|hint|about)$/i,
        action: () => {
            return Promise.resolve('Not implemented yet, sorry bud.');
        }
    },
    {
        matcher: /(?:restart|i want to die|kill me|retry)$/i,
        action: changeStateAndReturnIntro.bind(null, 'restart')
    },
    {
        matcher: /(?:where am i\??|my location|location info(?:rmation)?|info(?:rmation)?)$/i,
        action: (userState) => {
            return Promise.resolve(states[userState.currentState].text.intro);
        }
    }
];

const states = {
    'west-of-house': {
        text: {
            intro: locale['west-of-house'].intro
        },
        actions: [
            {
                matcher: locale['open-mailbox'].matcher,
                action: changeStateAndReturnIntro.bind(null, 'open-mailbox')
            }
        ],
        exits: {
            north: {},
            south: {},
            east: {},
            west: {
                travel: changeStateAndReturnIntro.bind(null, 'forest')
            }
        }
    },
    'open-mailbox': {
        text: {
            intro: locale['open-mailbox'].intro
        },
        actions: [
            {
                matcher: locale.leaflet.matcher,
                action: changeStateAndReturnIntro.bind(null, 'leaflet')
            }
        ]
    },
    leaflet: {
        text: {
            intro: locale.leaflet.intro
        },
        action: changeStateAndReturnIntro.bind(null, 'west-of-house')
    },
    forest: {
        text: {
            intro: locale.forest.intro
        },
        exits: {
            north: {},
            south: {},
            east: {
                travel: changeStateAndReturnIntro.bind(null, 'west-of-house')
            },
            west: {}
        }
    },
    clearing: {
        text: {
            intro: locale.clearing.intro
        },
        exits: {
            north: {},
            south: {},
            east: {
                travel: changeStateAndReturnIntro.bind(null, 'west-of-house')
            },
            west: {}
        },
        actions: []
    },
    restart: {
        text: {
            intro: locale.restart.intro,
        },
        actions: [
            {
                matcher: /(?:Y(?:es)?|confirm|accept|i want to die|kill me)$/i,
                action: (userState) => {
                    console.log(locale.restart.death);
                    return changeStateAndReturnIntro('newGame', userState);
                }
            },
            {
                matcher: /(?:N(?:o)?|negative)$/i,
                action: (userState) => {
                    return changeStateAndReturnIntro(null, userState.previousState, userState);
                }
            }
        ]
    },
    newGame: {
        text: {
            intro: locale.newGame.intro,
        },
        actions: [
            {
                matcher: /(?:Y(?:es)?|confirm|accept|)$/i,
                action: changeStateAndReturnIntro.bind(null, 'west-of-house')
            },
            {
                matcher: /(?:N(?:o)?|negative)$/i,
                action: changeStateAndReturnIntro.bind(null, 'newGame')
            }
        ]
    }
};

function initializeStates() {
    const stateKeys = Object.keys(states);
    for (let i = 0, il = stateKeys.length; i < il; i++) {
        if (states[stateKeys[i]].exits) {
            let exitKeys = Object.keys(states[stateKeys[i]].exits);
            for (let j = 0, jl = exitKeys.length; j < jl; j++) {

                // Make sure we have an actions array.
                states[stateKeys[i]].actions = states[stateKeys[i]].actions || [];

                // If we have a look action, push it on the stack. Otherwise create a "generic" one.
                states[stateKeys[i]].actions.push({
                    matcher: new RegExp(`(?:look|inspect|observe|view|peek) ${exitKeys[j]}$`, 'i'),
                    action: states[stateKeys[i]].exits[exitKeys[j]].look ? states[stateKeys[i]].exits[exitKeys[j]].look : () => {
                        return Promise.resolve(locale[stateKeys[i]].exits[exitKeys[j]].text.look || 'You see nothing of note.');
                    }
                });

                // If we have a travel action, push it on the stack. Otherwise create a "generic" one.
                states[stateKeys[i]].actions.push({
                    matcher: new RegExp(`(?:go|travel) ${exitKeys[j]}$`, 'i'),
                    action: states[stateKeys[i]].exits[exitKeys[j]].travel ? states[stateKeys[i]].exits[exitKeys[j]].travel : () => {
                        return Promise.resolve(locale[stateKeys[i]].exits[exitKeys[j]].text.travel || 'You can\'t travel in this direction');
                    }
                })
            }
        }
    }
}

function changeStateAndReturnIntro(state, userState) {
    return changeState(state, userState)
        .then(userState => {
            return Promise.resolve(states[userState.currentState].text.intro);
        });
}

function changeState(state, userState) {
    return new Promise((resolve, reject) => {
        if (states[state]) {
            userState.previousState = userState.currentState;
            userState.currentState = state;
            return resolve(userState);
        }
        return reject(new Error(`The State ${state} was not found`));
    });
}

function handleResponseForCurrentState(userState, response) {
    return new Promise(resolve => {
        // If we have a specific action we always want to execute, do that instead and short circuit here.
        if (states[userState.currentState].action) {
            return resolve(states[userState.currentState].action(userState));
        }

        if (states[userState.currentState].actions) {
            // Check the actions for our current state for a match.
            for (let i = 0, il = states[userState.currentState].actions.length; i < il; i++) {
                if (states[userState.currentState].actions[i].matcher.test(response)) {
                    return resolve(states[userState.currentState].actions[i].action(userState));
                }
            }
        }

        // Check our global actions for a match.
        for (let j = 0, jl = globalActions.length; j < jl; j++) {
            if (globalActions[j].matcher.test(response)) {
                return resolve(globalActions[j].action(userState));
            }
        }
        return resolve('You can\'t do that here.');
    });
}

function loadState(userId) {
    console.log(`Retrieving stored state for ${userId}.`);
    return fs.readFile(`${userId}.json`)
        .then((stateFile) => {
            console.log(`Found a stored state for ${userId}.`);
            return JSON.parse(stateFile.Body);
        }, (err) => {
            // If the user doesn't currently have a state, lets initialize for them.
            if (err.statusCode === 404 || err.name === 'ENOTFOUND') {
                console.log(`Didn't find a stored state for ${userId}, creating a new default state.`);
                return Promise.resolve({
                    previousState: '',
                    currentState: 'newGame'
                });
            }
            console.log(`Failed attempt to retrieve a stored state for ${userId}`);
            console.error(err);
            return Promise.reject(err);
        });
}

function storeState(userId, userState) {
    console.log(`Storing state for ${userId}`);
    return fs.writeFile(`${userId}.json`, JSON.stringify(userState));
}

initializeStates();
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
