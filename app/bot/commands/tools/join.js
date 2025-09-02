import { Command } from '../../../utils/command.js';

Command({
  name: 'other-join',
  description: 'Join group via link',
  alias: ['join'],
  tags : {
    label : 'tools'
  },
  run: async ({ sock, m }) => {
    const link = m.content.textWithoutCommand.trim();
    if (!link) return m.reply(__('cmd.join.ex', { prefix: m.content.prefix }));
    const [_, code] = link.match(/https?:\/\/chat.whatsapp.com\/(.*)/) || [null, null];

    await sock.groupAcceptInvite(code).then(() => {
      m.reply(__('cmd.join.success'));
    }).catch((e) => {
      m.reply(__('cmd.join.failed', { message: e.message }));
    });
  }
});