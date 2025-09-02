import { Command } from '../../../utils/command.js';
import { prisma } from '../../../utils/prisma.js';

Command({
  name: 'owner-owner',
  description: 'Manage Owner Bot',
  alias: ['own'],
  tags : {
    label : 'owner'
  },
  run: async ({ m }) => {
    if (!m.isSenderOwner && !m.isSenderBot) return;

    const text = m.content.textWithoutCommand.trim();
    const firstSpace = text.indexOf(' ');
    const body1 = firstSpace === -1 ? text : text.slice(0, firstSpace);
    const body2 = firstSpace === -1 ? '' : text.slice(firstSpace + 1);

    if (!body1) return m.reply(__('cmd.owner.owner.ex', { command: m.content.command }));

    switch(body1.toLowerCase()) {
    case 'list':
      const owners = m.db.bot.owners;
      let text = '*Prefix List*\n\n';
      owners.forEach((v, i) => text += `▷ ${i + 1}. ${v}\n`);
      m.reply(text);
      break;
    case 'add':
    case 'set':
    case 'push':
      if (!body2) return m.reply(__('cmd.owner.owner.ex', { command: m.content.command }));
      await prisma.Bot.update({ where: { id: m.db.bot.id }, data: { owners: [...m.db.bot.owners, body2] } });
      m.db.bot.clearCache();
      m.reply(__('cmd.owner.owner.added', { number: body2 }));
      break;
    case 'remove':
    case 'del':
      if (!body2) return m.reply(__('cmd.owner.owner.ex', { command: m.content.command }));
      await prisma.Bot.update({ where: { id: m.db.bot.id }, data: { owners: m.db.bot.owners.filter(v => v !== body2) } });
      m.db.bot.clearCache();
      m.reply(__('cmd.owner.owner.removed', { number: body2 }));
      break;
    default:
      m.reply(__('cmd.owner.owner.ex', { command: m.content.command }));
    }

  }
});