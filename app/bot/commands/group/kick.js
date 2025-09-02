import { Command } from '../../../utils/command.js';

Command({
  name: 'group-kick',
  description: 'Kick member from group',
  alias: ['kick'],
  tags : {
    label : 'group'
  },
  run: async ({ sock, m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    if(!m.quoted && !m.content.mentionedJid.length) return m.reply(__('cmd.group.kick.ex', { prefix: m.content.prefix }));

    let jids = [];
    if(m.quoted) jids.push(m.quoted.sender);
    if(m.content.mentionedJid.length) jids = m.content.mentionedJid;

    for (let jid of jids) {
      await sock.groupParticipantsUpdate(m.chat, [jid], 'remove');
    }
  }
});