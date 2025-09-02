import { prisma } from '../../utils/prisma.js';

export const handler = async (sock, m, $next) => {
  if (m.isSenderBot) return $next;
  if (!m.isGroup) return $next;
  if (m.isSenderOwner) return $next;
  if (m.isSenderAdmin) return $next;
  if (!m.isBotAdmin) return $next;
  if (!m.db?.group?.wordBlocker?.enable) return $next;

  const blockedWords = m.db.group.wordBlocker.list || [];
  const text = m.content.text.toLowerCase();
  const groupCode = await sock.groupInviteCode(m.chat);

  for (const word of blockedWords) {
    if (new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text.toLowerCase())) {
      if (text.includes('chat.whatsapp.com')) {
        if (new RegExp(`https?:\\/\\/chat\\.whatsapp\\.com\\/${groupCode}`, 'i').test(text)) {
          break;
        }
      }

      const participant = m.db.groupParticipant;
      const group = m.db.group;

      if (participant.strike <= group.maxStrike) {
        await sock.sendMessage(m.chat, { delete: m.key });

        await prisma.groupParticipant.update({
          where: { id: participant.id },
          data: { strike: participant.strike + 1 }
        });

        await m.reply(__('cmd.group.wordblocker.message', {
          word: word,
          maxStrike: group.maxStrike,
          strike: participant.strike + 1
        }));
      } else {
        await sock.sendMessage(m.chat, { delete: m.key });
        await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
        await prisma.groupParticipant.delete({ where: { id: participant.id }});
      }

      break;
    }
  }

  return $next;
};
