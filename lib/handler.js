const twilioHandler = require('./twilioHandler');
const lexHandler = require('./lexHandler');

module.exports = {
    handleTwilio: twilioHandler.handle,
    handleLex: lexHandler.handle
};