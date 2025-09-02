import { Command } from '../../../utils/command.js';
import { generateWAMessageFromContent, WAProto } from 'baileys';

Command({
  name: 'group-add',
  description: 'Add member to group.',
  alias: ['add'],
  tags : {
    label : 'group'
  },
  run: async ({ sock, m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    let jid = m.content.textWithoutCommand.trim();
    if (!jid) return await m.reply(__('cmd.group.add.ex', { prefix: m.content.prefix }));
    jid = jid.includes('@s.whatsapp.net') ? jid : jid + '@s.whatsapp.net';

    const response = await sock.groupParticipantsUpdate(m.chat, [jid], 'add');

    for (let res of response) {
      if (res.status == 421) {
        m.reply(res.content.content[0].tag);
      }

      if (res.status == 408) {
        await m.reply(__('cmd.group.add.invited', { jid: res.jid.split('@')[0] }));
        await m.sendMessage(res.jid, {
          text: 'https://chat.whatsapp.com/' + (await sock.groupInviteCode(m.chat)),
        });
      }

      if (res.status == 403) {
        await m.reply(__('cmd.group.add.invited', { jid: res.jid.split('@')[0] }));
        const { code, expiration } = res.content.content[0].attrs;
        const pp = await sock.profilePictureUrl(m.chat, 'image').catch(() => null);

        const msgs = generateWAMessageFromContent(
          res.jid,
          WAProto.Message.fromObject({
            groupInviteMessage: {
              groupJid: m.chat,
              inviteCode: code,
              inviteExpiration: expiration,
              groupName: m.groupMetadata.subject,
              jpegThumbnail: pp || null,
              caption: '',
            },
          }),
          { userJid: sock.user.jid }
        );

        await m.sendMessage(res.jid, { forward: msgs, });
      }

      if (res.status == 409) {
        await m.reply(__('cmd.group.add.already', { jid: response[0].content.attrs.phone_number.split('@')[0] }));
      }
    }
  }
});