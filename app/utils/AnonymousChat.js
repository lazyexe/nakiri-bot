const AnonymousChatMap = new Map();
import * as luxon from 'luxon';

class AnonymousChat {
  constructor({ m }) {
    this.m = m;
    this.messagePrefix = '*[Anonymous Chat]* ';
    this.maxAttempts = 3;
    this.map = AnonymousChatMap;
  }

  async start(userJid) {
    if (AnonymousChatMap.has(userJid)) {
      const userMap = AnonymousChatMap.get(userJid);
      if (userMap.status === 'in-queue') {
        return this.m.reply(this.messagePrefix + __('anonymousChat.alreadyInQueue'));
      } else if (userMap.status === 'in-chat') {
        return this.m.reply(this.messagePrefix + __('anonymousChat.alreadyInChat'));
      }
    }

    AnonymousChatMap.set(userJid, {
      matchWith: null,
      status: 'in-queue',
      attempts: 0,
      joinedAt: luxon.DateTime.now()
    });

    await this.m.reply(this.messagePrefix + __('anonymousChat.inQueue'));

    const partnerJid = await this.findWaitingPartner(userJid);

    if (partnerJid) {
      const userMap = AnonymousChatMap.get(userJid);
      const partnerMap = AnonymousChatMap.get(partnerJid);

      AnonymousChatMap.set(userJid, { 
        ...userMap,
        matchWith: partnerJid, 
        status: 'in-chat',
        joinedAt: luxon.DateTime.now() 
      });

      AnonymousChatMap.set(partnerJid, { 
        ...partnerMap,
        matchWith: userJid, 
        status: 'in-chat',
        joinedAt: luxon.DateTime.now() 
      });

      this.m.sendMessage(userJid, { text: this.messagePrefix + __('anonymousChat.matched') });
      this.m.sendMessage(partnerJid, { text: this.messagePrefix + __('anonymousChat.matched') });
    }
  }

  async stop(userJid) {
    if (!AnonymousChatMap.has(userJid)) {
      return this.m.reply(this.messagePrefix + __('anonymousChat.notInChat'));
    }

    const userMap = AnonymousChatMap.get(userJid);

    if (userMap.status === 'in-chat' && userMap.matchWith) {
      await this.m.sendMessage(userMap.matchWith, { text: this.messagePrefix + __('anonymousChat.partnerLeft') });
      const partnerMap = AnonymousChatMap.get(userMap.matchWith);
      if (partnerMap.attempts >= this.maxAttempts) {
        AnonymousChatMap.delete(userMap.matchWith);
        await this.m.sendMessage(userMap.matchWith, { text: this.messagePrefix + __('anonymousChat.maxAttempts') });
      } else {
        AnonymousChatMap.set(userMap.matchWith, { 
          ...partnerMap, 
          matchWith: null, 
          status: 'in-queue',
          attempts: partnerMap.attempts + 1,
          joinedAt: luxon.DateTime.now()
        });
      }
    }

    AnonymousChatMap.delete(userJid);
    await this.m.reply(this.messagePrefix + __('anonymousChat.left'));
  }

  async skip(userJid) {
    if (!AnonymousChatMap.has(userJid)) return this.m.reply(this.messagePrefix + __('anonymousChat.example'));

    const userMap = AnonymousChatMap.get(userJid);

    if (userMap.status === 'in-chat' && userMap.matchWith) {
      const partnerMap = AnonymousChatMap.get(userMap.matchWith);
      if (partnerMap.attempts >= this.maxAttempts) {
        await this.m.sendMessage(userMap.matchWith, { text: this.messagePrefix + __('anonymousChat.maxAttempts') });
        AnonymousChatMap.delete(userMap.matchWith);
      } else {
        await this.m.sendMessage(userMap.matchWith, { text: this.messagePrefix + __('anonymousChat.partnerLeft') });
        AnonymousChatMap.set(userMap.matchWith, {
          ...partnerMap,
          matchWith: null,
          status: 'in-queue',
          attempts: partnerMap.attempts + 1,
          joinedAt: luxon.DateTime.now()
        });
      }
    } else if (userMap.status === 'in-queue') {
      return this.m.reply(this.messagePrefix + __('anonymousChat.alreadyInQueue'));
    }

    AnonymousChatMap.set(userJid, { 
      ...userMap,
      matchWith: null, 
      status: 'in-queue',
      attempts: 0,
      joinedAt: Date.now() 
    });

    await this.m.reply(this.messagePrefix + __('anonymousChat.findNewPartner'));

    const partnerJid = await this.findWaitingPartner(userJid);
    if (partnerJid) {
      const partnerMap = AnonymousChatMap.get(partnerJid);
      AnonymousChatMap.set(userJid, { 
        ...userMap,
        matchWith: partnerJid, 
        status: 'in-chat',
        joinedAt: luxon.DateTime.now() 
      });
      AnonymousChatMap.set(partnerJid, { 
        ...partnerMap,
        matchWith: userJid, 
        status: 'in-chat',
        joinedAt: luxon.DateTime.now() 
      });

      this.m.sendMessage(userJid, { text: this.messagePrefix + __('anonymousChat.matched') });
      this.m.sendMessage(partnerJid, { text: this.messagePrefix + __('anonymousChat.matched') });
    } else {
      this.m.reply(this.messagePrefix + __('anonymousChat.inQueue'));
    }
  }

  async findWaitingPartner(userJid) {
    const waitingUsers = Array.from(AnonymousChatMap.entries())
      .filter(([jid, data]) => jid !== userJid && data.status === 'in-queue')
      .sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

    return waitingUsers.length > 0 ? waitingUsers[0][0] : null;
  }

  async info() {
    const users = Array.from(AnonymousChatMap.values());
    return {
      users: {
        total: users.length,
        inChat: users.filter(user => user.status === 'in-chat').length,
        inQueue: users.filter(user => user.status === 'in-queue').length
      }
    };
  }
}

export default AnonymousChat;
