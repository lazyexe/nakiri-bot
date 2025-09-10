import { Command } from '../../../utils/command.js';
import { prisma } from '../../../utils/prisma.js';
import currencyInstance from '../../../utils/currency.js';
import * as luxon from 'luxon';

Command({
  name: 'personal-info',
  description: 'My Profile Info',
  alias: ['profile', 'my', 'me'],
  tags : {
    label : 'personal'
  },
  run: async ({ m }) => {
    let user = m.db.user;
    let groupParticipant = m.db.groupParticipant;

    if (m.quoted) {
      user = await prisma.User.findUnique({ where: { jid: m.quoted.sender } });
      if (m.isGroup) {
        groupParticipant = await prisma.GroupParticipant.findUnique({ where: { 
          groupId_jid: {
            jid: m.quoted.sender,
            groupId: m.groupMetadata.id
          }
        }});
      }
    }

    if (m.content.mentionedJid.length) {
      user = await prisma.User.findUnique({ where: { jid: m.content.mentionedJid[0] } });
      if (m.isGroup) {
        groupParticipant = await prisma.GroupParticipant.findUnique({ where: {
          groupId_jid: {
            jid: m.content.mentionedJid[0],
            groupId: m.groupMetadata.id
          }  
        } });
      }
    }

    let text;
    
    if (user) {
      text += '*❖ [ User Status ] ❖*\n';
      text += `▸ Name : *${user.pushName}*\n`;
      text += `▸ Balance : *${currencyInstance.roundAmount(user.balance).toFixed(2)}*\n`;
      text += `▸ Exp : *${user.exp}*\n`;
      text += `▸ Subscribe : *${user.subscription.type.toUpperCase()}*\n`;
      text += `▸ Registered : *${luxon.DateTime.fromJSDate(new Date(user.createdAt)).toRelative()}*`;
    }

    if (m.isGroup && groupParticipant) {
      if (user) {
        text += '\n\n';
      }
      text += '*❖ [ Group Status ] ❖*\n';
      text += `▸ Social Credit : *${groupParticipant.score}*\n`;
      text += `▸ Strike : *${groupParticipant.strike}/${m.db.group.maxStrike}*\n`;
      text += `▸ Role : *${m.groupMetadata.participants.find(v => v.jid === user.jid).admin}*\n`;
    }

    await m.reply(text);
  }
});