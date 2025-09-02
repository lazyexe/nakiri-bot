import { z, ZodError } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { bot } from '../../bot/socket.js';
import profilePicture from '../../utils/profilePicture.js';
import serializeApi from '../../utils/serializeApi.js';
import { generateWAMessageFromContent, WAProto } from 'baileys';

class GroupController {
  async index(req, res) 
  {
    try {
      const validate = z.object({
        page: z.string().optional().default('1').transform(Number),
        limit: z.string().optional().default('10').transform(Number),
        sortBy: z
          .enum(['subject', 'createdAt', 'updatedAt'])
          .optional()
          .default('createdAt'),
        order: z.enum(['asc', 'desc']).optional().default('asc'),
        search: z.string().optional().default(''),
      });

      const { page, limit, sortBy, order, search } = validate.parse(req.query);

      const [groups, total] = await prisma.$transaction([
        prisma.Group.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            [sortBy]: order,
          },
          where: {
            subject: {
              contains: search,
              mode: 'insensitive',
            },
            visible: {
              equals: true,
            },
          },
        }),
        prisma.Group.count({
          where: {
            subject: {
              contains: search,
              mode: 'insensitive',
            },
            visible: {
              equals: true,
            },
          },
        }),
      ]);

      const sock = await bot(process.env.SESSION_NAME);

      const groupPromises = groups.map(async group => {
        const imageUrl = await profilePicture({ sock, jid: group.jid, name: group.id });

        return {
          ...group,
          image: imageUrl,
        };
      });

      const resolvedGroups = await Promise.all(groupPromises);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        message: 'Groups fetched successfully.',
        data: {
          groups: resolvedGroups,
          pagination: {
            current: page,
            limit: limit,
            total: total,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Error validating request.',
          errors: error.flatten().fieldErrors,
        });
      }

      console.error('[Express] Error getting groups:', error);
      return res.status(500).json({
        message: 'Failed to get groups.',
      });
    }
  }

  async detail(req, res) 
  {
    try {
      const validate = z.object({
        id: z.string(),
      });

      const { id } = validate.parse(req.params);

      const group = await prisma.Group.findFirst({
        where: {
          id: id,
        },
      });

      if (!group) {
        return res.status(404).json({
          message: 'Group not found or not visible.',
        });
      }

      let finalGroupData = {
        metadata: null,
        ...group,
      };

      const sock = await bot(process.env.SESSION_NAME);
      const metadata = sock ? await sock.getGroupCache(group.groupId) : null;
      const serialize = await serializeApi({ sock, metadata, user: req.user });

      if (!serialize.isUserAdmin && group.visible === false) {
        return res.status(404).json({
          message: 'Group not found or not visible.',
        });
      }

      finalGroupData.serialize = serialize;

      if (metadata) {
        if (serialize.isUserAdmin) {
          finalGroupData.metadata = {
            ...metadata,
            image: await profilePicture({ sock, jid: group.groupId, name: group.id }),
          };
        } else {
          finalGroupData.metadata = {
            subject: metadata.subject,
            image: await profilePicture({ sock, jid: group.groupId, name: group.id }),
            size: metadata.size,
            creation: metadata.creation,
            desc: metadata.desc,
            restrict: metadata.restrict,
            announce: metadata.announce,
            isCommunity: metadata.isCommunity,
            isCommunityAnnounce: metadata.isCommunityAnnounce,
            joinApprovalMode: metadata.joinApprovalMode,
            memberAddMode: metadata.memberAddMode,
            ephemeralDuration: metadata.ephemeralDuration,
          };
        }
      }

      return res.status(200).json({
        message: 'Group found.',
        data: finalGroupData,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Error validating request.',
          errors: error.flatten().fieldErrors,
        });
      }

      console.error('[Express] Error getting group details:', error);
      return res.status(500).json({
        message: 'Failed to get group details.',
      });
    }
  }

  async participants(req, res) 
  {
    try {
      const validate = z.object({
        id: z.string(),
      });

      const { id } = validate.parse(req.params);

      const group = await prisma.Group.findFirst({
        where: {
          id: id,
        },
      });

      if (!group) {
        return res.status(404).json({
          message: 'Group not found.',
        });
      }

      const sock = await bot(process.env.SESSION_NAME);
      const metadata = sock ? await sock.getGroupCache(group.groupId) : null;
      const serialize = await serializeApi({ sock, metadata, user: req.user });

      if (!serialize.isUserAdmin) {
        return res.status(403).json({
          message: 'You are not authorized.',
        });
      }

      const participantsPrisma = await prisma.GroupParticipant.findMany({
        where: {
          groupId: group.groupId,
        },
      });

      const scoreMap = new Map();
      for (const p of participantsPrisma) {
        scoreMap.set(p.jid, p.score);
      }

      const pushName = await prisma.User.findMany({
        select: {
          jid: true,
          pushName: true
        },
        where: {
          jid: {
            in: metadata.participants.map((p) => p.jid),
          },
        }
      });

      const pushNameMap = new Map();
      for (const p of pushName) {
        pushNameMap.set(p.jid, p.pushName);
      }

      const participantsPromises = metadata.participants.map(async (participant) => {
        // const image = await profilePicture({
        //   sock,
        //   jid: participant.jid
        // });

        return {
          jid: participant.jid,
          name: pushNameMap.get(participant.jid) || '~',
          image: null,
          score: scoreMap.get(participant.jid) || 0,
        };
      });

      const participants = await Promise.all(participantsPromises);

      participants.sort((a, b) => b.score - a.score);

      return res.status(200).json({
        message: 'Group found.',
        participants,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Error validating request.',
          errors: error.flatten().fieldErrors,
        });
      }

      console.error('[Express] Error getting group details:', error);
      return res.status(500).json({
        message: 'Failed to get participants group',
      });
    }
  }

  async settingVisible(req, res) 
  {
    try {
      const validate = z.object({
        toggle: z.boolean(),
      });

      const { toggle } = validate.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized.',
        });
      }

      const group = await prisma.Group.findFirst({
        where: {
          id: req.params.id,
        },
      });

      if (!group) {
        return res.status(404).json({
          message: 'Group not found.',
        });
      }

      if (group.visible === toggle) {
        return res.status(200).json({
          message: toggle
            ? 'Group is already visible.'
            : 'Group is already hidden.',
        });
      }

      const sock = await bot(process.env.SESSION_NAME);
      const metadata = await sock.getGroupCache(group.groupId);
      const serialize = await serializeApi({ sock, metadata, user: req.user });

      if (!serialize.isBotAdmin) {
        return res.status(403).json({
          message: 'Nakiri is not admin in this group.',
        });
      }

      if (serialize.isUserAdmin) {
        const link = toggle ? await sock.groupInviteCode(group.groupId) : '';
        await prisma.Group.update({
          where: {
            id: group.id,
          },
          data: {
            visible: toggle,
            link,
          },
        });
      } else {
        return res.status(403).json({
          message: 'You are not authorized to toggle group visibility.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Group visibility toggled successfully.',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Error validating request.',
          errors: error.flatten().fieldErrors,
        });
      }

      console.error('[Express] Error group controller:', error);
      return res.status(500).json({
        message: 'Failed to toggle group visibility.',
      });
    }
  }

  async settingDatabase(req, res) 
  {
    try {
      const validate = z.object({
        publicFeatures: z.array(z.string()).optional(),
        maxStrike: z.number().optional(),
        wordBlocker: z.object({
          enable: z.boolean(),
          message: z.string(),
          list: z.array(z.string()),
        }).optional(),
        antiMention: z.object({
          enable: z.boolean(),
          message: z.string(),
        }).optional(),
        welcome: z.object({
          enable: z.boolean(),
          message: z.string(),
        }).optional(),
        activityScore: z.boolean().optional(),
      });

      const body = validate.parse(req.body || {});

      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized.',
        });
      }

      const group = await prisma.Group.findFirst({
        where: {
          id: req.params.id,
        },
      });

      if (!group) {
        return res.status(404).json({
          message: 'Group not found.',
        });
      }

      const sock = await bot(process.env.SESSION_NAME);
      const metadata = await sock.getGroupCache(group.groupId);
      const serialize = await serializeApi({ sock, metadata, user: req.user });

      if (!serialize.isUserAdmin) {
        return res.status(403).json({
          message: 'You are not authorized to update group data.',
        });
      }

      const updatedGroup = await prisma.Group.update({
        where: {
          id: group.id,
        },
        data: {
          ...body
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Group data updated successfully.',
        data: updatedGroup,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Error validating request.',
          errors: error.flatten().fieldErrors,
        });
      } 

      console.error('[Express] Error group controller:', error);
      return res.status(500).json({
        message: 'Failed to update group data.',
      });
    }
  }

  async settingParticipant(req, res) 
  {
    try {
      const validate = z.object({
        action: z.enum(['add', 'remove', 'promote', 'demote']),
        jid: z.string().regex(/^[0-9]+@s.whatsapp.net$/),
      });

      const { action, jid } = validate.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized.',
        });
      }

      const group = await prisma.Group.findFirst({
        where: {
          id: req.params.id,
        },
      });

      if (!group) {
        return res.status(404).json({
          message: 'Group not found.',
        });
      }

      const sock = await bot(process.env.SESSION_NAME);
      const metadata = await sock.getGroupCache(group.groupId);
      const serialize = await serializeApi({ sock, metadata, user: req.user });

      if (!serialize.isBotAdmin) {
        return res.status(403).json({
          message: 'Nakiri is not admin in this group.',
        });
      }

      if (!serialize.isUserAdmin) {
        return res.status(403).json({
          message: 'You are not authorized to update participant group.',
        });
      }

      const response = await sock.groupParticipantsUpdate(group.groupId, [ jid ], action);

      if (action == 'add') {
        if (response[0].status == 408) {
          await sock.sendMessage(jid, {
            text: 'https://chat.whatsapp.com/' + (await sock.groupInviteCode(group.groupId)),
          });
        }

        if (response[0].status == 403) {
          const { code, expiration } = response.content.content[0].attrs;
          const msgs = generateWAMessageFromContent(
            response.jid,
            WAProto.Message.fromObject({
              groupInviteMessage: {
                groupJid: group.groupId,
                inviteCode: code,
                inviteExpiration: expiration,
                groupName: group.subject,
                jpegThumbnail: null,
                caption: '',
              },
            }),
            { userJid: sock.user.jid }
          );
  
          await sock.sendMessage(response.jid, { forward: msgs, });
        }
      }

      return res.status(200).json({
        message: 'Group participant update.',
        data: response,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Error validating request.',
          errors: error.flatten().fieldErrors,
        });
      }

      console.error('[Express] Error group controller:', error);
      return res.status(500).json({
        message: 'Failed to update participant group.',
      });
    }
  }

  async settingMetadata(req, res) 
  {
    try {
      const validate = z.object({
        subject: z.string().optional(),
        desc: z.string().optional(),
        whoCanSendMessage: z.enum(['admin', 'everyone']).optional(),
        whoCanSetting: z.enum(['admin', 'everyone']).optional(),
      });

      const { subject, desc, whoCanSendMessage, whoCanSetting } = validate.parse(req.body || {});

      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized.',
        });
      }

      const group = await prisma.Group.findFirst({
        where: {
          id: req.params.id,
        },
      });

      if (!group) {
        return res.status(404).json({
          message: 'Group not found.',
        });
      }

      const sock = await bot(process.env.SESSION_NAME);
      const metadata = await sock.getGroupCache(group.groupId);
      const serialize = await serializeApi({ sock, metadata, user: req.user });

      if (!serialize.isBotAdmin) {
        return res.status(403).json({
          message: 'Nakiri is not admin in this group.',
        });
      }

      if (!serialize.isUserAdmin) {
        return res.status(403).json({
          message: 'You are not authorized to update participant group.',
        });
      }

      if (subject && subject != group.subject) {
        await sock.groupUpdateSubject(group.groupId, subject);
      }

      if (desc && desc != group.desc) {
        await sock.groupUpdateDescription(group.groupId, desc);
      }

      if (whoCanSendMessage && whoCanSendMessage != (metadata.announce ? 'admin' : 'everyone')) {
        await sock.groupSettingUpdate(group.groupId, whoCanSendMessage == 'admin' ? 'announcement' : 'not_announcement');
      }

      if (whoCanSetting && whoCanSetting != (metadata.restrict ? 'admin' : 'everyone')) {
        await sock.groupSettingUpdate(group.groupId, whoCanSetting == 'admin' ? 'locked' : 'unlocked');
      }

      return res.status(200).json({
        message: 'Success update metadata group.',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Error validating request.',
          errors: error.flatten().fieldErrors,
        });
      }

      console.error('[Express] Error group controller:', error);
      return res.status(500).json({
        message: 'Failed to update metadata group.',
      });
    }
  }
}

export default GroupController;