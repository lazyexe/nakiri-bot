import { Command } from '../../../utils/command.js';
import { prisma } from '../../../utils/prisma.js';
import fs from 'fs';
import path from 'path';

Command({
  name: 'group-setlang',
  description: 'Set language group.',
  alias: ['setlang', 'lang'],
  tags : {
    label : 'group'
  },
  run: async ({ m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    const lang = m.content.textWithoutCommand.trim().toLowerCase();
    const langs = fs.readdirSync(path.join(__basedir, 'app', 'lang')).map(v => v.split('.')[0]);
    
    if (!lang) return m.reply(__('cmd.group.setlang.ex', { command: m.content.command, langs: langs.join(', ') }));
    if (!langs.includes(lang)) return m.reply(__('cmd.group.setlang.ex', { command: m.content.command, langs: langs.join(', ') }));

    await prisma.Group.update({ where: { id: m.db.group.id }, data: { lang }});
    m.reply(__('cmd.group.setlang.success', { lang }));
  }
});