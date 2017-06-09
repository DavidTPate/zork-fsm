'use strict';
const Locale = require('./locales/locale-enUS');
const State = require('./state');

const globalActions = [
    {
        matcher: Locale.globals.information.matcher,
        action: () => {
            return Promise.resolve(Locale.globals.information.text);
        }
    },
    {
        matcher: Locale.globals.restart.matcher,
        action: changeStateAndReturnIntro.bind(null, 'restart')
    },
    {
        matcher: Locale.globals.whereAmI.matcher,
        action: (userState) => {
            return Promise.resolve(gameStates[userState.currentState].text.intro);
        }
    },
    {
        matcher: Locale.globals.cantLookAround.matcher,
        action: () => {
            return Promise.resolve(Locale.globals.cantLookAround.text);
        }
    }
];

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
                    text: Locale.clearing.removeBoards.text
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
                matcher: Locale.clearing.removeBoards.matcher,
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
                matcher: Locale.restart.yes.matcher,
                action: (userState) => {
                    return changeStateAndReturnIntro('newGame', userState);
                }
            },
            {
                matcher: Locale.restart.no.matcher,
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
                matcher: Locale.newGame.yes.matcher,
                action: changeStateAndReturnIntro.bind(null, 'west-of-house')
            },
            {
                matcher: Locale.newGame.no.matcher,
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
                    matcher: new RegExp(`${Locale.globals.look.matcher} ${exitKeys[j]}`, 'i'),
                    action: states[stateKeys[i]].exits[exitKeys[j]].look ? states[stateKeys[i]].exits[exitKeys[j]].look : () => {
                            return Promise.resolve(Locale[stateKeys[i]].exits[exitKeys[j]].text.look || Locale.globals.look.nothingOfNote.text);
                        }
                });

                // If we have a travel action, push it on the stack. Otherwise create a "generic" one.
                states[stateKeys[i]].actions.push({
                    matcher: new RegExp(`${Locale.globals.travel.matcher} ${exitKeys[j]}`, 'i'),
                    action: states[stateKeys[i]].exits[exitKeys[j]].travel ? states[stateKeys[i]].exits[exitKeys[j]].travel : () => {
                            return Promise.resolve(Locale[stateKeys[i]].exits[exitKeys[j]].text.travel || Locale.globals.travel.notThatDirection.text);
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

function handleResponseForCurrentState(userState, response) {
    return new Promise(resolve => {
        // If we have a specific action we always want to execute, do that instead and short circuit here.
        if (gameStates[userState.currentState].action) {
            return resolve(gameStates[userState.currentState].action(userState));
        }

        // Sanitize that shit.
        response = response.trim();
        if (gameStates[userState.currentState].actions) {
            // Check the actions for our current state for a match.
            for (let i = 0, il = gameStates[userState.currentState].actions.length; i < il; i++) {
                if (gameStates[userState.currentState].actions[i].matcher.test(response)) {
                    return resolve(gameStates[userState.currentState].actions[i].action(userState));
                }
            }
        }

        // Check our global actions for a match.
        for (let j = 0, jl = globalActions.length; j < jl; j++) {
            if (globalActions[j].matcher.test(response)) {
                return resolve(globalActions[j].action(userState));
            }
        }
        return resolve(Locale.globals.cantDoThatHere.text);
    });
}

module.exports = {
    globalActions: globalActions,
    gameStates: gameStates,
    initializeStates: initializeGameStates,
    handleResponseForCurrentState: handleResponseForCurrentState
};