'use strict';
const S3FS = require('s3fs');
const fs = new S3FS(process.env.STATE_BUCKET_NAME, {
    region: process.env.AWS_REGION
});

function saveState(userId, userState) {
    console.log(`Storing state for ${userId}`);
    return fs.writeFile(`${userId}.json`, JSON.stringify(userState));
}

function getState(userId) {
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

function changeState(state, userState) {
    return new Promise((resolve) => {
        userState.previousState = userState.currentState;
        userState.currentState = state;
        return resolve(userState);
    });
}

module.exports = {
    getState: getState,
    saveState: saveState,
    changeState: changeState
};