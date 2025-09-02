import { jidNormalizedUser } from 'baileys';
import consola from 'consola';
import { prisma } from '../../utils/prisma.js';
import { GROUP_DEFAULT, PARTICIPANT_DEFAULT } from '../../utils/schemaData.js';

export default async function ({
  id,
  sock
}) {
  sock.ev.on('groups.update', async ([event]) => {
    try {
      const metadata = await sock.groupMetadata(event.id);
      if (metadata) {
        await upsertGroup(metadata);
        sock.setGroupCache(event.id, metadata);
      }
      consola.success(`[WA: ${id}] Group Metadata Updated for ${event.id}.`);
    } catch {
      await deleteGroup(event.id);
      sock.delGroupCache(event.id);
      consola.error(`[WA: ${id}] Group Metadata Update Failed for ${event.id}.`);
    }
  });

  sock.ev.on('group-participants.update', async (event) => {
    consola.success(`[WA: ${id}] Group Participants Updated for ${event.id}.`);
    // if bot left / kicked from group
    if(event.action == 'remove' && event.participants.includes(jidNormalizedUser(sock.user.id))) {
      await deleteGroup(event.id);
      sock.delGroupCache(event.id);
      return;
    } else if (event.action == 'remove') {
      // if user remove
      await prisma.GroupParticipant.deleteMany({
        where: {
          groupId: event.id,
          jid: {
            in: event.participants
          }
        }
      });
    } else if (event.action == 'promote' || event.action == 'demote') {
      await prisma.GroupParticipant.upsert({
        where: {
          groupId_jid: {
            jid: event.participants[0],
            groupId: event.id
          }
        },
        update: {
          isAdmin: event.action == 'promote' ? true : false
        },
        create: {
          ...PARTICIPANT_DEFAULT,
          jid: event.participants[0],
          groupId: event.id,
          isAdmin: event.action == 'promote' ? true : false
        },
      });
    }

    // update cache group
    try {
      const metadata = await sock.groupMetadata(event.id);
      if (metadata) {
        sock.setGroupCache(event.id, metadata);
      }
    } catch {
      await deleteGroup(event.id);
      sock.delGroupCache(event.id);
    }
  });
    
  async function upsertGroup(metadata) {
    await prisma.Group.upsert({
      where: { groupId: metadata.id },
      create: {
        ...GROUP_DEFAULT,
        groupId: metadata.id,
        subject: metadata.subject,
        joinApprovalMode: metadata.joinApprovalMode,
      },
      update: {
        subject: metadata.subject,
        joinApprovalMode: metadata.joinApprovalMode
      }
    });
  }

  async function deleteGroup(id) {
    try {
      await prisma.$transaction([
        prisma.GroupParticipant.deleteMany({
          where: {
            groupId: id
          }
        }),

        prisma.Group.delete({
          where: { groupId: id }
        })
      ]);
            
      consola.success(`[WA: ${id}] Group deleted successfully.`);
    } catch (error) {
      consola.error(`[WA: ${id}] Error while deleting group: ${error.message}`);
    }
  }
};