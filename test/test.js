'use strict';
const Chai = require('chai');
Chai.use(require('chai-as-promised'));
Chai.use(require('dirty-chai'));
const expect = Chai.expect;
const Promise = require('bluebird');
const S3fs = require('s3fs');

const Locale = require('../lib/locales/locale-enUS');

const bucketName = 'zork-test-buckets' + (Math.random() + '').slice(2, 8);
const fs = new S3fs(bucketName);

let Game;

describe('Full Test Suite', () => {
    before(() => {
        process.env.STATE_BUCKET_NAME = bucketName;
        Game = require('../lib/game');
        return fs.create();
    });
    after(() => {
        return fs.destroy()
            .catch((err) => {
                if (err.code === 'NoSuchBucket') {
                    // If the bucket doesn't exist during cleanup we don't need to consider it an issue
                    return Promise.resolve();
                } else {
                    return Promise.reject(err);
                }
            });
    });
    it('should tell me where I start out for a new game', () => {
        return expect(Game.handleResponseForCurrentState({
            previousState: '',
            currentState: 'newGame'
        }, 'Greetings Human, let\s have a normal human conversation')).to.eventually.equal(Locale['west-of-house'].intro);
    });
    it('should be able to look in all directions West of the House', () => {
        return lookAllDirections('west-of-house', {
            previousState: 'newGame',
            currentState: 'west-of-house'
        });
    });
    it('should be able to travel in all directions West of the House', () => {
        return travelAllDirections('west-of-house', {
            previousState: 'newGame',
            currentState: 'west-of-house'
        }, {
            north: '',
            south: '',
            east: '',
            west: 'forest'
        });
    });
});

function lookAllDirections(stateName, userState) {
    return Promise.all(Object.keys(Game.gameStates[stateName].exits).map((direction) => {
        return expect(Game.handleResponseForCurrentState(userState, `look ${direction}`)).to.eventually.equal(Locale[stateName].exits[direction].text.look || Locale.globals.nothingOfNote);
    }));
}

function travelAllDirections(stateName, userState, expectedNewState) {
    return Promise.all(Object.keys(Game.gameStates[stateName].exits).map((direction) => {
        // If we are expecting to transition to a new state, let's expect the intro text to come through for the new state.
        if (expectedNewState[direction]) {stateName
            return expect(Game.handleResponseForCurrentState(userState, `travel ${direction}`)).to.eventually.equal(Locale[expectedNewState[direction]].intro);
        }
        // Otherwise, just use the travel text.
        return expect(Game.handleResponseForCurrentState(userState, `travel ${direction}`)).to.eventually.equal(Locale[stateName].exits[direction].text.travel || Locale.globals.notThatDirection);
    }));
}