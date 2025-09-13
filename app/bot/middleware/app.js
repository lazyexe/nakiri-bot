const middleware = new Map();

import * as activityScore from './activityScore.js';
import * as antiMention from './antiMention.js';
import * as wordBlocker from './wordBlocker.js';
import * as AnonymousChat from './AnonymousChat.js';
import * as BlackJack from './blacjack.js';
// import messageRecovery from './messageRecovery.js';
// import nakiriOld from './old-nakiri.js';
import nakiri from './nakiri.js';

middleware.set('activityScore.js', activityScore);
middleware.set('antiMention.js', antiMention);
middleware.set('wordBlocker.js', wordBlocker);
middleware.set('AnonymousChat.js', AnonymousChat);
middleware.set('BlackJack.js', BlackJack);
// middleware.set('messageRecovery.js', messageRecovery);
// middleware.set('nakiri.js', nakiriOld);
middleware.set('nakiri.js', nakiri);

export default middleware;