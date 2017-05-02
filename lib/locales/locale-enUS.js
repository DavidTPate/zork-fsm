module.exports = {
    globals: {
        cantDoThatHere: 'You can\'t do that here.',
        processingIssue: 'There was an issue processing your request, please try again later.',
        nothingOfNote: 'You see nothing of note.',
        notThatDirection: 'You can\'t travel in this direction',
        cantLookAround: 'You can\'t just look around all willy nilly, try looking in a specific direction.',
        information: 'This game is about discovering your actions, try LOOKing in directions and at things.\nIf you want to move around try TRAVELing in that direction.'
    },
    restart: {
        intro: 'Are you sure you want to restart and lose your current progress?',
        death: [
            'Having given up all hope you decide to finally listen to your Grandmother, just like she always said:',
            '"If all else fails, just wait for the answer to come to you. If you want it bad enough, it\'ll happen."',
            'So you take a seat and wait to learn what to do, but it never happens and you are eventually consumed by a wandering grue.',
            'Apparently you didn\'t want it bad enough. Try wanting it more next time.'
        ].join('\n')
    },
    newGame: {
        intro: 'Do you want to start a new game of Grok?'
    },
    'west-of-house': {
        intro: [
            'You are in an open field on the west side of a white house with a boarded front door.',
            'There is a small mailbox in front of the house'
        ].join('\n'),
        exits: {
            north: {
                text: {
                    look: 'You see a wide expanse of pasture land, there\'s nothing note-worthy from what you can tell.',
                    travel: 'You see no point in heading north as there is nothing that way from what you can tell.'
                }
            },
            south: {
                text: {
                    look: 'You see a wide expanse of pasture land, there\'s nothing note-worthy from what you can tell.',
                    travel: 'You see no point in heading south as there is nothing that way from what you can tell.'
                }
            },
            east: {
                text: {
                    look: 'You see a beautiful colonial era house with its doors and windows boarded up.',
                    travel: 'The door to the house is boarded and you cannot remove the boards.'
                }
            },
            west: {
                text: {
                    look: 'You see a forest of pine trees with the backdrop of a low hanging sun.'
                }
            }
        }
    },
    'open-mailbox': {
        matcher: /(?:open|look in(?:side)?) (?:mail|(?:mail)?-?box)/i,
        intro: 'You open the mailbox and find a single leaflet inside.'
    },
    leaflet: {
        matcher: /(?:read|take|open|inspect|look at) (?:note|leaflet|envelope|message|mail|letter)/i,
        intro: [
            'Welcome to Grok!',
            'The adventure you are about to embark on was inspired by the game Zork which was created in 1979 by a team at the MIT Laboratory for Computer Science.',
            'Grok, like Zork, is a text-based adventure game where you are trying to complete the adventure.',
            'This will require some thought on your part to figure out what you can do and where you can go.',
            'Some HINTS can be acquired by asking for them along with INFO about the game.'
        ].join('\n')
    },
    forest: {
        intro: 'You are in a forest with trees in all directions. To the west you see sunlight peeking through between the trees.',
        exits: {
            north: {
                text: {
                    look: 'As you peer at the forest to the north you see it very quickly becoming more and more dense.',
                    travel: 'As you attempt to travel further north the forest quickly becomes too dense to traverse. You decide to head back to where you entered the forest.'
                }
            },
            south: {
                text: {
                    look: 'To the south you see a dense forest filled with brush.',
                    travel: 'You would need a machete to go any further to the south.'
                }
            },
            east: {
                text: {
                    look: 'You recognize this as the path back to the boarded up house.',
                }
            },
            west: {
                text: {
                    look: 'You see some sunlight peeking through the trees.',
                }
            }
        }
    },
    clearing: {
        intro: [
            'You are in a small clearing within the forest, with trees all around you.',
            'On the ground you see an open manhole with a ladder taking you into a dimly lit area.',
            'To the south you see a what looks to be an abandoned mine.'
        ].join('\n'),
        introBoardRemoves: [
            'You are in a small clearing within the forest, with trees all around you.',
            'On the ground you see an open manhole with a ladder taking you into a dimly lit area.',
            'To the south you see a what looks to be an abandoned mine with boards scattered on the ground that you removed from the entrance.'
        ].join('\n'),
        exits: {
            north: {
                text: {}
            },
            south: {
                text: {
                    look: 'You see what looks to be an abandoned mine with rusted tracks outside and weathered boards over the entrance.',
                    travel: 'You approach the mine but quickly figure out that you won\'t be able to enter the mine with these boards in the way.'
                }
            },
            east: {
                text: {}
            },
            west: {
                text: {
                    look: 'You see a dense forest with trees strewn all over the place. You think this might have been caused by a recent storm.',
                }
            }
        }
    }
};