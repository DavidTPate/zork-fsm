'use strict';
const Locale = require('./locales/locale-enUS');
const State = require('./state');

const IntentActions = {
    TravelDirection: {
        north: {
            'west-of-house': {
                text: Locale.globals.notThatDirection
            }
        },
        south: {
            'west-of-house': {
                text: Locale.globals.notThatDirection
            }
        },
        east: {
            'west-of-house': {
                text: Locale.globals.notThatDirection
            }
        },
        west: {
            'west-of-house': {
                fn: changeStateAndReturnIntro.bind(null, 'forest')
            }
        }
    }
};

const gameStates = initializeGameStates({
    'west-of-house': {
        text: {
            intro: Locale['west-of-house'].intro
        },
        actions: [
            {
                matcher: Locale['open-mailbox'].matcher,
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
            intro: Locale['open-mailbox'].intro
        },
        actions: [
            {
                matcher: Locale.leaflet.matcher,
                action: changeStateAndReturnIntro.bind(null, 'leaflet')
            }
        ]
    },
    leaflet: {
        text: {
            intro: Locale.leaflet.intro
        },
        action: changeStateAndReturnIntro.bind(null, 'west-of-house')
    },
    forest: {
        text: {
            intro: Locale.forest.intro
        },
        exits: {
            north: {},
            south: {},
            east: {
                travel: changeStateAndReturnIntro.bind(null, 'west-of-house')
            },
            west: {
                travel: changeStateAndReturnIntro.bind(null, 'clearing')
            }
        }
    },
    clearing: {
        text: {
            intro: [
                {
                    property: 'clearingBoardsRemoved',
                    expectedValue: undefined,
                    text: Locale.clearing.intro
                },
                {
                    property: 'clearingBoardsRemoved',
                    expectedValue: true,
                    text: Locale.clearing.introBoardRemoves
                }
            ]
        },
        exits: {
            north: {},
            south: {},
            east: {
                travel: changeStateAndReturnIntro.bind(null, 'forest')
            },
            west: {}
        },
        actions: [
            {
                matcher: /(?:remove|take(?: off)?|break) (?:weathered)? ?(?:boards?)/i,
                action: (userState) => {
                    userState.clearingBoardsRemoved = true;
                    return changeStateAndReturnIntro('clearing', userState);
                }
            }
        ]
    },
    restart: {
        text: {
            intro: Locale.restart.intro,
        },
        actions: [
            {
                matcher: /(?:Y(?:es)?|confirm|accept|i want to die|kill me)/i,
                action: (userState) => {
                    console.log(Locale.restart.death);
                    return changeStateAndReturnIntro('newGame', userState);
                }
            },
            {
                matcher: /(?:N(?:o)?|negative)/i,
                action: (userState) => {
                    return changeStateAndReturnIntro(null, userState.previousState, userState);
                }
            }
        ]
    },
    newGame: {
        text: {
            intro: Locale.newGame.intro,
        },
        actions: [
            {
                matcher: /(?:Y(?:es)?|confirm|accept|)/i,
                action: changeStateAndReturnIntro.bind(null, 'west-of-house')
            },
            {
                matcher: /(?:N(?:o)?|negative)/i,
                action: changeStateAndReturnIntro.bind(null, 'newGame')
            }
        ]
    }
});

function initializeGameStates(states) {
    const stateKeys = Object.keys(states);
    for (let i = 0, il = stateKeys.length; i < il; i++) {
        if (states[stateKeys[i]].exits) {
            let exitKeys = Object.keys(states[stateKeys[i]].exits);
            for (let j = 0, jl = exitKeys.length; j < jl; j++) {

                // Make sure we have an actions array.
                states[stateKeys[i]].actions = states[stateKeys[i]].actions || [];

                // If we have a look action, push it on the stack. Otherwise create a "generic" one.
                states[stateKeys[i]].actions.push({
                    matcher: new RegExp(`(?:look ?(at)?|inspect|observe|view|peek) ${exitKeys[j]}$`, 'i'),
                    action: states[stateKeys[i]].exits[exitKeys[j]].look ? states[stateKeys[i]].exits[exitKeys[j]].look : () => {
                        return Promise.resolve(Locale[stateKeys[i]].exits[exitKeys[j]].text.look || Locale.globals.nothingOfNote);
                    }
                });

                // If we have a travel action, push it on the stack. Otherwise create a "generic" one.
                states[stateKeys[i]].actions.push({
                    matcher: new RegExp(`(?:go|head|walk|travel|approach|go to) ${exitKeys[j]}$`, 'i'),
                    action: states[stateKeys[i]].exits[exitKeys[j]].travel ? states[stateKeys[i]].exits[exitKeys[j]].travel : () => {
                        return Promise.resolve(Locale[stateKeys[i]].exits[exitKeys[j]].text.travel || Locale.globals.notThatDirection);
                    }
                })
            }
        }
    }

    return states;
}

function changeStateAndReturnIntro(stateName, originalUserState) {
    return State.changeState(stateName, originalUserState)
        .then(userState => {
            let intro = gameStates[userState.currentState].text.intro;

            if (typeof intro === 'string') {
                return Promise.resolve(gameStates[userState.currentState].text.intro);
            } else if (Array.isArray(intro)) {
                for (let i = 0, il = intro.length; i < il; i++) {
                    if (userState[intro[i].property] === intro[i].expectedValue) {
                        return Promise.resolve(intro[i].text);
                    }
                }
            }
        });
}

function getAction(userState, intent) {
    return new Promise(resolve => {
       const intentSelector = Object.keys(intent.slots).map(slotName => intent.slots[slotName].toLowerCase()).join('|');
       return resolve(IntentActions[intent.name][intentSelector][userState.currentState]);
    });
}

function handleResponseForCurrentState(userState, intent) {
    return getAction(userState, intent)(action => {
        if (action.fn) {
            return action.fn(userState);
        } else if (action.text) {
            return action.text;
        }
        return Locale.globals.cantDoThatHere;
    });
}

module.exports = {
    handleResponseForCurrentState: handleResponseForCurrentState
};