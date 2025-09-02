import { prisma } from '../../utils/prisma.js';

export const handler = async (sock, m, $next) => {
  if (m.isSenderBot) return $next;
  if (!m.isGroup) return $next;
  if (m.isSenderOwner) return $next;
  if (m.isSenderAdmin) return $next;
  if (m.mtype != 'groupStatusMentionMessage') return $next;
  if (!m.isBotAdmin) return $next;
  if (!m.db?.group?.antiMention?.enable) return $next;
      
  const participant = m.db.groupParticipant;
  const group = m.db.group;

  if (participant.strike < group.maxStrike) {
    await sock.sendMessage(m.chat, { delete: m.key });

    await prisma.groupParticipant.update({
      where: { id: participant.id },
      data: { strike: participant.strike + 1 }
    });

    await m.reply(__('cmd.group.antimention.message', {
      maxStrike: group.maxStrike,
      strike: participant.strike + 1
    }));
  } else {
    await sock.sendMessage(m.chat, { delete: m.key });
    await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
  }

  return $next;
};
