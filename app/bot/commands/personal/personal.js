const { Command } = require('../../../utils/command.js');
const luxon = require('luxon');

Command({
  name: 'personal-info',
  description: 'My Profile Info',
  alias: ['profile', 'my', 'me'],
  tags : {
    label : 'personal'
  },
  run: async ({ sock, m }) => {
    let text = '*❖ [ Group Status ] ❖*\n';
    text += `▸ Name : *${m.pushName}*\n`;
    text += `▸ Balance : *${m.db.user.balance.toLocaleString()}*\n`;
    text += `▸ Exp : *${m.db.user.exp}*\n`;
    text += `▸ Subscribe : *${m.db.user.subscription.type.toUpperCase()}*\n`;
    text += `▸ Registered : *${luxon.DateTime.fromJSDate(new Date(m.db.user.createdAt)).toRelative()}*`;

    if (m.isGroup) {
      text += '\n\n';
      text += '*❖ [ Group Status ] ❖*\n';
      text += `▸ Social Credit : *${m.db.groupParticipant.score}*\n`;
      text += `▸ Strike : *${m.db.groupParticipant.strike}/${m.db.group.maxStrike}*\n`;
      text += `▸ Role : *${m.groupMetadata.participants.find(v => v.jid === m.sender).admin}*\n`;
    }


    let image = null;
    image = await sock.profilePictureUrl(m.sender, 'image').catch(() => null);

    await m.sendMessage(m.chat, {
      text,
      contextInfo: {
        externalAdReply: {
          title: 'Personal Profile',
          body: `- ${m.pushName} -`,
          mediaType: 2,
          thumbnailUrl: image,
          sourceUrl: 'https://nakiri.koding.in',
        }
      }
    });
  }
});