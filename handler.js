const twilioHandler = require('./lib/twilioHandler');
const lexHandler = require('./lib/lexHandler');

module.exports = {
    handleTwilio: twilioHandler.handle,
    handleLex: lexHandler.handle
};