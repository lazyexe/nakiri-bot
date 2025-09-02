import { Command } from '../../../utils/command.js';
import AnonymousChat from '../../../utils/AnonymousChat.js';

Command({
  name: 'anonymouschat-start',
  description: 'Anonymous Chat',
  alias: ['anonymouschat', 'start'],
  tags : {
    label : 'fun'
  },
  run: async ({ m }) => {
    if (m.isSenderBot) return;
    if (m.isGroup) return m.reply(__('cmd.fun.anonymousChat.onlyPrivate', { command: m.content.command }));

    const user = m.sender;
    const AnonChat = new AnonymousChat({ m });
    AnonChat.start(user);
  }
});