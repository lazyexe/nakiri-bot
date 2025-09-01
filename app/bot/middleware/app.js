const middleware = new Map();

middleware.set('activityScore.js', require('./activityScore.js'));
middleware.set('antiMention.js', require('./antiMention.js'));
middleware.set('wordBlocker.js', require('./wordBlocker.js'));
middleware.set('AnonymousChat.js', require('./AnonymousChat.js'));
middleware.set('BlackJack.js', require('./blacjack.js'));
// middleware.set('messageRecovery.js', require('./messageRecovery.js'));
// middleware.set('nakiri.js', require('./old-nakiri.js'));
// middleware.set('nakiri.js', require('./nakiri.js'));

module.exports = middleware;