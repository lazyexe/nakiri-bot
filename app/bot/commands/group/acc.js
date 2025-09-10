import { Command } from '../../../utils/command.js';

Command({
  name: 'group-acc-request',
  description: 'Accept all member request join group.',
  alias: ['acc'],
  tags : {
    label : 'group'
  },
  run: async ({ sock, m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    const maxMemberGroup = 1025;
    const curretMemberGroup = m.groupMetadata.size;
    const reminingMember = maxMemberGroup - curretMemberGroup;
    m.react('⌛');
    
    if (reminingMember == 0) {
      m.react('');
      return m.reply(__('cmd.group.acc.max', { maxMemberGroup, curretMemberGroup }));
    }

    let joinRequestList = await sock.groupRequestParticipantsList(m.groupMetadata.id);

    if (joinRequestList.length == 0) {
      m.react('');
      return m.reply(__('cmd.group.acc.noRequest'));
    }

    joinRequestList = joinRequestList.sort((a, b) => Number(a.request_time) - Number(b.request_time));
    let currentRemining = reminingMember;
    let error_number = [];
    for (let member of joinRequestList) {
      if (currentRemining == 0) break;
      try {
        await sock.groupRequestParticipantsUpdate(m.groupMetadata.id, [ member.jid ], 'approve');
      } catch {
        error_number.push(member.phone_number);
      }
      currentRemining--;
    }
    m.react('✨');
  }
});