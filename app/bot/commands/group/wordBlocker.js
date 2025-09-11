import { Command } from '../../../utils/command.js';
import { prisma } from '../../../utils/prisma.js';

Command({
  name: 'group-wordblocker',
  description: 'Wordblocker group',
  alias: ['wordblocker', 'wb'],
  tags : {
    label : 'group'
  },
  run: async ({ m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    const text = m.content.textWithoutCommand.trim();
    const firstSpace = text.indexOf(' ');
    const body1 = firstSpace === -1 ? text : text.slice(0, firstSpace);
    const body2 = firstSpace === -1 ? '' : text.slice(firstSpace + 1);

    if (!body1) return m.reply(__('cmd.group.wordblocker.ex', { command: m.content.command }));
            
    switch (body1.toLowerCase()) {
    case 'enable':
    case 'on':
      if (m.db.group.wordBlocker.enable) return m.reply(__('cmd.group.wordblocker.alreadyOn'));
      await prisma.group.update({
        where: { id: m.db.group.id }, 
        data: {
          wordBlocker: {
            ...m.db.group.wordBlocker,
            enable: true,
          }
        }
      });
      m.reply(__('cmd.group.wordblocker.on'));
      break;

    case 'disable':
    case 'off':
      if (!m.db.group.wordBlocker.enable) return m.reply(__('cmd.group.wordblocker.alreadyOff'));
      await prisma.group.update({ 
        where: { id: m.db.group.id }, 
        data: {
          wordBlocker: {
            ...m.db.group.wordBlocker,
            enable: false,
          }
        }
      });
      m.reply(__('cmd.group.wordblocker.off'));
      break;
                
    case 'add':
      if (!body2) return m.reply(__('cmd.group.wordblocker.ex', { command: m.content.command }));
      await prisma.group.update({ 
        where: { id: m.db.group.id }, 
        data: {
          wordBlocker: {
            ...m.db.group.wordBlocker,
            list: [
              ...m.db.group.wordBlocker.list,
              body2
            ],
          }
        }
      });
      m.reply(__('cmd.group.wordblocker.add', { word: body2 }));
      break;

    case 'remove':
      if (!body2) return m.reply(__('cmd.group.wordblocker.ex', { command: m.content.command }));
      await prisma.group.update({
        where: { id: m.db.group.id }, 
        data: {
          wordBlocker: {
            ...m.db.group.wordBlocker,
            list: [
              ...m.db.group.wordBlocker.list.filter(l => l !== body2)
            ],
          }
        }
      });
      m.reply(__('cmd.group.wordblocker.remove', { word: body2 }));
      break;

    case 'message':
      if (!body2) return m.reply(__('cmd.group.wordblocker.ex', { command: m.content.command }));
      await prisma.group.update({
        where: { id: m.db.group.id }, 
        data: {
          wordBlocker: {
            ...m.db.group.wordBlocker,
            message: body2
          }
        }
      });
      m.reply(__('cmd.group.wordblocker.message'));
      break;

    case 'list':
      m.reply(`❖ List Wordblocker\n${m.db.group.wordBlocker.list.map((l) => `▷ ${l}`).join('\n')}`);
      break;
            
    default:
      m.reply(__('cmd.group.wordblocker.ex', { command: m.content.command }));
    }
  }
});