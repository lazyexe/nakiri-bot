import { Command } from '../../../utils/command.js';
import { prisma } from '../../../utils/prisma.js';

Command({
  name: 'group-random-kick',
  description: 'Random kick member from group.',
  alias: ['randomkick', 'rkick'],
  tags : {
    label : 'group'
  },
  run: async ({ m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    const body = m.content.textWithoutCommand.trim();
    const regex = /(\d+)-(\d+)\s(\d+)/;
    const match = body.match(regex);
    let minScore, maxScore, totalToKick;

    if (match && match.length === 4) {
      minScore = parseInt(match[1], 10);
      maxScore = parseInt(match[2], 10);
      totalToKick = parseInt(match[3], 10);
    } else {
      return m.reply(__('cmd.group.randomkick.ex', { command: m.content.command }));
    }

    const participantsPrisma = await prisma.GroupParticipant.findMany({
      select: {
        jid: true,
        score: true
      },
      where: { groupId: m.db.group.groupId }
    });

    const scoreMap = new Map();
    participantsPrisma.forEach(p => scoreMap.set(p.jid, p.score));

    const participantsWithScores = m.groupMetadata.participants.map(v => {
      return {
        jid: v.jid,
        score: scoreMap.get(v.jid) || 0,
        isAdmin: Boolean(v.admin)
      };
    });

    const filteredParticipants = participantsWithScores.filter(p => {
      return p.score >= minScore && p.score <= maxScore && !p.isAdmin;
    });

    const shuffledParticipants = filteredParticipants.sort(() => Math.random() - 0.5);
    const randomParticipants = shuffledParticipants.slice(0, totalToKick);

    let success = 0, failed = 0;
    for (const participant of randomParticipants) {
      try {
        await sock.groupParticipantsUpdate(m.chat, [ participant.jid ], 'remove');
        success++;
      } catch {
        failed++;
      }
    }
    
    m.reply(__('cmd.group.randomkick.success', { success, failed, totalToKick }));
  }
});