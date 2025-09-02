import { z, ZodError } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { bot } from '../../bot/socket.js';
import profilePicture from '../../utils/profilePicture.js';
 
class AccountController {
  constructor() {}
  
  async index(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized.',
        });
      }

      const sock = await bot(process.env.SESSION_NAME);

      return res.status(200).json({
        message: 'Success fetch account.',
        data: {
          ...req.user,
          image: await profilePicture({ sock, jid: req.user.jid, name: req.user.id }),
        }
      });
    } catch (error) {
      console.error('[Express] Error account controller:', error);
      return res.status(500).json({
        message: 'Failed to fetch account.',
      });
    }
  }

  async logout(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized.',
        });
      }

      await prisma.User.update({
        where: {
          jid: req.user.jid,
        },
        data: {
          token: '',
        },
      });

      return res.status(200).json({
        message: 'Success logout.',
      });
    } catch (error) {
      console.error('[Express] Error account controller:', error);
      return res.status(500).json({
        message: 'Failed to logout.',
      });
    }
  }

  async MyGroups(req, res) {
    try {
      const validate = z.object({
        page: z.string().optional().default('1').transform(Number),
        limit: z.string().optional().default('10').transform(Number),
        sortBy: z.enum(['subject', 'createdAt', 'updatedAt']).optional().default('createdAt'),
        order: z.enum(['asc', 'desc']).optional().default('asc'),
        search: z.string().optional().default('')
      });

      const { page, limit, sortBy, order, search } = validate.parse(req.query);

      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized.',
        });
      }

      const jid = req.user.jid;

      // ✅ OPTIMASI: Gabung kedua query dalam 1 transaction untuk performa
      const [groups, total] = await prisma.$transaction([
        prisma.Group.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            [sortBy]: order,
          },
          where: {
            AND: [
              {
                subject: {
                  contains: search,
                  mode: 'insensitive',
                }
              },
              {
                participants: {
                  some: {
                    jid: jid,
                    isAdmin: true
                  }
                }
              }
            ]
          },
          select: {
            id: true,
            groupId: true,
            subject: true,
            visible: true,
            link: true,
            publicFeatures: true,
            joinApprovalMode: true,
            maxStrike: true,
            wordBlocker: true,
            antiMention: true,
            welcome: true,
            activityScore: true,
            createdAt: true,
            updatedAt: true,
            participants: {
              where: {
                jid: jid
              },
              select: {
                isAdmin: true,
                strike: true,
                score: true
              },
              take: 1 // ✅ Hanya ambil 1 record karena kita tahu pasti user ada
            }
          }
        }),
        prisma.Group.count({
          where: {
            AND: [
              {
                subject: {
                  contains: search,
                  mode: 'insensitive',
                }
              },
              {
                participants: {
                  some: {
                    jid: jid,
                    isAdmin: true
                  }
                }
              }
            ]
          }
        })
      ]);

      const sock = await bot(process.env.SESSION_NAME);

      const groupPromises = groups.map(async (group) => {
        const imageUrl = await profilePicture({ sock, jid: group.groupId, name: group.id });
                
        return {
          ...group,
          image: imageUrl,
        };
      });

      const resolvedGroups = await Promise.all(groupPromises);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        message: 'Successfully retrieved own groups.',
        data: {
          groups: resolvedGroups,
          pagination: {
            current: page,
            limit: limit,
            total: total,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Error validating request.',
          errors: error.flatten().fieldErrors,
        });
      }

      console.error('[Express] Error account controller:', error);
      return res.status(500).json({
        message: 'Failed to fetch own group.',
      });
    }
  }
}

export default AccountController;