import { Command } from '../../../utils/command.js';

Command({
  name: 'group-promote',
  description: 'Promote member in group',
  alias: ['promote'],
  tags : {
    label : 'group'
  },
  run: async ({ sock, m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    if(!m.quoted && !m.content.mentionedJid.length) return m.reply(__('cmd.group.promote.ex', { command: m.content.command }));

    let jids = [];
    if(m.quoted) jids.push(m.quoted.sender);
    if(m.content.mentionedJid.length) jids = m.content.mentionedJid;

    for (let jid of jids) {
      await sock.groupParticipantsUpdate(m.chat, [jid], 'promote');
    }

    m.reply(__('cmd.group.promote.success', { jids: jids.map(v => '@' + v.split('@')[0]).join(', ') }));
  }
});

Command({
  name: 'group-demote',
  description: 'Demote member in group',
  alias: ['demote'],
  tags : {
    label : 'group'
  },
  run: async ({ sock, m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    if(!m.quoted && !m.content.mentionedJid.length) return m.reply(__('cmd.group.demote.ex', { command: m.content.command }));

    let jids = [];
    if(m.quoted) jids.push(m.quoted.sender);
    if(m.content.mentionedJid.length) jids = m.content.mentionedJid;

    for (let jid of jids) {
      await sock.groupParticipantsUpdate(m.chat, [jid], 'demote');
    }

    m.reply(__('cmd.group.demote.success', { jids: jids.map(v => '@' + v.split('@')[0]).join(', ') }));
  }
});