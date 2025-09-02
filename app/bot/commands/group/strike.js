import { Command } from '../../../utils/command.js';
import { prisma } from '../../../utils/prisma.js';

Command({
  name: 'group-strike',
  description: 'Set the maximum number of strikes before a member is removed from the group.',
  alias: ['strike'],
  tags : {
    label : 'group'
  },
  run: async ({ m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    const body = m.content.textWithoutCommand.trim();
    if (!body) return m.reply(__('cmd.group.strike.ex', { command: m.content.command }));

    await prisma.group.update({ where: { id: m.db.group.id }, data: { maxStrike: parseInt(body) }});

    m.reply(__('cmd.group.strike.success', { maxStrike: parseInt(body) }));
  }
});