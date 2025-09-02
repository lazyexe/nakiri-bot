import { Command } from '../../../utils/command.js';

Command({
  name: 'group-restrict-features',
  description: 'How can use bot in group.',
  alias: ['restrict'],
  tags : {
    label : 'group'
  },
  run: async ({ m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;

    const body = m.content.textWithoutCommand.trim();
    const accessAvailable = ['everyone', 'adminonly'];
    if (!body) return m.reply(__('cmd.group.accessFeatures.ex', { command: m.content.command }));
    if (!accessAvailable.includes(body)) return m.reply(__('cmd.group.accessFeatures.ex', { command: m.content.command }));
    
    await prisma.group.update({ where: { id: m.db.group.id }, data: { accessFeatures: body }});
    m.reply(body == 'everyone' ? __('cmd.group.accessFeatures.setEveryone') : __('cmd.group.accessFeatures.setAdminOnly'));
  }
});