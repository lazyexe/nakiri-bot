import { Command } from '../../../utils/command.js';

Command({
  name: 'group-hidetag',
  description: 'Hidetag member.',
  alias: ['hidetag'],
  tags : {
    label : 'group'
  },
  run: async ({ m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;

    const participants = m.groupMetadata.participants;
    const mentions = participants.map(v => v.jid);

    if (m.content.isImage) {
      const image = await m.downloadMedia();
      await m.sendMessage(m.chat, { image, caption: m.content.textWithoutCommand, mentions });
    } else if (m.content.isText) {
      await m.sendMessage(m.chat, { text: m.content.textWithoutCommand, mentions });
    }
  }
});