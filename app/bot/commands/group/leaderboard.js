import { Command } from '../../../utils/command.js';
import { prisma } from '../../../utils/prisma.js';

Command({
  name: 'group-leaderboard',
  description: 'Leaderboard group.',
  alias: ['leaderboard', 'ld', 'rank'],
  tags : {
    label : 'group'
  },
  run: async ({ m }) => {
    if (!m.isGroup) return;
    if (!m.isSenderAdmin) return;
    if (!m.isBotAdmin) return m.reply(__('cmd.botNotAdmin'));

    const participantsPrisma = await prisma.GroupParticipant.findMany({
      where: { groupId: m.db.group.groupId },
      orderBy: { score: 'desc' }
    });
    
    m.reply(`*Group Leaderboard*\n\n${participantsPrisma.map((participant, index) => `${index + 1}. @${participant.jid.split('@')[0]} - ${participant.score}`).join('\n')}`);
  }
});