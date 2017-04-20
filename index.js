const inquirer = require('inquirer');
const Promise = require('bluebird');
const locale = require('./locale-enUS');
const S3FS = require('s3fs');

let user = {};

const globalActions = [
    {
        matcher: /(?:help|hint|about)$/i,
        action: () => {
            console.log('Ain\'t no rest for the wicked.');
            return Promise.resolve();
        }
    },
    {
        matcher: /(?:restart|i want to die|kill me|retry)$/i,
        action: changeState.bind(null, 'restart')
    },
    {
        matcher: /(?:where am i\??|my location|location info(?:rmation)?|info(?:rmation)?)$/i,
        action: () => {
            user.introRead = false;
            return Promise.resolve();
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
                action: changeState.bind(null, 'open-mailbox')
            }
        ],
        exits: {
            north: {},
            south: {},
            east: {},
            west: {
                travel: changeState.bind(null, 'forest')
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
                action: changeState.bind(null, 'leaflet')
            }
        ]
    },
    leaflet: {
        text: {
            intro: locale.leaflet.intro
        },
        action: changeState.bind(null, 'west-of-house')
    },
    forest: {
        text: {
            intro: locale.forest.intro
        },
        exits: {
            north: {},
            south: {},
            east: {
                travel: changeState.bind(null, 'west-of-house')
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
                travel: changeState.bind(null, 'west-of-house')
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
                action: () => {
                    console.log(locale.restart.death);
                    return changeState('newGame');
                }
            },
            {
                matcher: /(?:N(?:o)?|negative)$/i,
                action: changeState.bind(null, user.previousState)
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
                action: () => {
                    resetPlayerState();
                    return Promise.resolve();
                }
            },
            {
                matcher: /(?:N(?:o)?|negative)$/i,
                action: () => {
                    return Promise.reject();
                }
            }
        ]
    }
};

function resetPlayerState() {
    user = {
        previousState: '',
        currentState: 'west-of-house',
        introRead: false
    };
}

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
                        console.log(locale[stateKeys[i]].exits[exitKeys[j]].text.look || 'You see nothing of note.');
                        return Promise.resolve();
                    }
                });

                // If we have a travel action, push it on the stack. Otherwise create a "generic" one.
                states[stateKeys[i]].actions.push({
                    matcher: new RegExp(`(?:go|travel) ${exitKeys[j]}$`, 'i'),
                    action: states[stateKeys[i]].exits[exitKeys[j]].travel ? states[stateKeys[i]].exits[exitKeys[j]].travel : () => {
                        console.log(locale[stateKeys[i]].exits[exitKeys[j]].text.travel || 'You can\'t travel in this direction');
                        return Promise.resolve();
                    }
                })
            }
        }
    }
}

function changeState(state) {
    return new Promise((resolve, reject) => {
        if (states[state]) {
            user.previousState = user.currentState;
            user.currentState = state;
            return resolve();
        }
        return reject(new Error(`The State ${state} was not found`));
    });
}

function getInput(question) {
    if (question) {
        console.log(question);
    }

    return inquirer.prompt({
        type: 'input',
        name: 'answer',
        message: 'What do you do?'
    });
}

function handleResponseForCurrentState(response) {
    return new Promise((resolve) => {
        // If we have a specific action we always want to execute, do that instead and short circuit here.
        if (states[user.currentState].action) {
            return resolve(states[user.currentState].action());
        }

        if (states[user.currentState].actions) {
            // Check the actions for our current state for a match.
            for (let i = 0, il = states[user.currentState].actions.length; i < il; i++) {
                if (states[user.currentState].actions[i].matcher.test(response.answer)) {
                    return resolve(states[user.currentState].actions[i].action());
                }
            }
        }

        // Check our global actions for a match.
        for (let j = 0, jl = globalActions.length; j < jl; j++) {
            if (globalActions[j].matcher.test(response.answer)) {
                return resolve(globalActions[j].action());
            }
        }
        console.log('You can\'t do that here.');
        return resolve();
    }).then(handleCurrentState);
}

function handleCurrentState() {
    let promise;
    if (!user.introRead) {
        user.introRead = true;
        promise = getInput(states[user.currentState].text.intro);
    } else {
        promise = getInput();
    }

    return promise
        .then(handleResponseForCurrentState);
}

resetPlayerState();
initializeStates();
handleCurrentState()
    .catch(console.error);