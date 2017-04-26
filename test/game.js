'use strict';
const Chai = require('chai');
Chai.use(require('chai-as-promised'));
Chai.use(require('dirty-chai'));
const expect = Chai.expect;
const Promise = require('bluebird');

const Locale = require('../lib/locales/locale-enUS');

const bucketName = 'zork-test-buckets' + (Math.random() + '').slice(2, 8);
process.env.STATE_BUCKET_NAME = bucketName;
const Game = require('../lib/game');

describe('Full Test Suite', () => {
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
    it('should be able to open the mailbox and read the leaflet West of the House', () => {
        return expect(Game.handleResponseForCurrentState({
            previousState: 'newGame',
            currentState: 'west-of-house'
        }, 'open mailbox')).to.eventually.equal(Locale['open-mailbox'].intro).then(() => {
            return expect(Game.handleResponseForCurrentState({
                previousState: 'west-of-house',
                currentState: 'open-mailbox'
            }, 'read leaflet')).to.eventually.equal(Locale.leaflet.intro);
        });
    });
    it('should be able to look in all directions in the Forest', () => {
        return lookAllDirections('forest', {
            previousState: 'west-of-house',
            currentState: 'forest'
        });
    });
    it('should be able to travel in all directions in the Forest', () => {
        return travelAllDirections('forest', {
            previousState: 'west-of-house',
            currentState: 'forest'
        }, {
            north: '',
            south: '',
            east: 'west-of-house',
            west: 'clearing'
        });
    });
    it('should be able to look in all directions in the Clearing', () => {
        return lookAllDirections('clearing', {
            previousState: 'forest',
            currentState: 'clearing'
        });
    });
    it('should be able to travel in all directions in the Clearing', () => {
        return travelAllDirections('clearing', {
            previousState: 'forest',
            currentState: 'clearing'
        }, {
            north: '',
            south: '',
            east: 'forest',
            west: ''
        });
    });
});

function lookAllDirections(stateName, userState) {
    return Promise.all(Object.keys(Game.gameStates[stateName].exits).map((direction) => {
        return expect(Game.handleResponseForCurrentState(Object.assign({}, userState), `look ${direction}`)).to.eventually.equal(Locale[stateName].exits[direction].text.look || Locale.globals.nothingOfNote);
    }));
}

function travelAllDirections(stateName, userState, expectedNewState) {
    return Promise.all(Object.keys(Game.gameStates[stateName].exits).map((direction) => {
        // If we are expecting to transition to a new state, let's expect the intro text to come through for the new state.
        if (expectedNewState[direction]) {
            return expect(Game.handleResponseForCurrentState(Object.assign({}, userState), `go ${direction}`)).to.eventually.equal(Locale[expectedNewState[direction]].intro);
        }
        // Otherwise, just use the travel text.
        return expect(Game.handleResponseForCurrentState(Object.assign({}, userState), `go ${direction}`)).to.eventually.equal(Locale[stateName].exits[direction].text.travel || Locale.globals.notThatDirection);
    }));
}