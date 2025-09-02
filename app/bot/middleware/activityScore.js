import nodeCache from 'node-cache';
import { prisma } from '../../utils/prisma.js';

const cache = new nodeCache({ stdTTL: 600 }); // cache for 10 minutes

export const handler = async (sock, m, $next) => {
  if (m.isSenderBot) return $next;
  if (!m.isGroup) return $next;
  if (!m.db?.group?.activityScore) return $next;
  if (!m.db?.groupParticipant) return $next;

  const key = `${m.groupMetadata.id}-${m.sender}`;

  if (!cache.has(key)) {
    cache.set(key, true);

    m.db.groupParticipant.score += 1;

    await prisma.groupParticipant.update({
      where: { id: m.db.groupParticipant.id },
      data: { score: m.db.groupParticipant.score }
    });
  }
};