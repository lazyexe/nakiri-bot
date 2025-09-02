import { PrismaClient } from '../prisma/index.js';
import { consola } from 'consola';
import { BOT_DEFAULT } from '../utils/schemaData.js';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

const initPrisma = async () => {
  try {
    prisma.$connect();
    consola.success('[PRISMA] Prisma connected.');
    await createBotSettings();
  } catch (error) {
    consola.error('[PRISMA] Error connecting to Prisma:', error);
  }
};

const createBotSettings = async () => {
  try {
    if (await prisma.Bot.findFirst({})) return;
    await prisma.Bot.create({
      data: {
        ...BOT_DEFAULT,
      }
    });
    consola.success('[PRISMA] Bot settings created.');
  } catch (error) {
    consola.error('[PRISMA] Error creating bot settings :', error);
  }
};

const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    consola.success('[PRISMA] Prisma disconnected.');
  } catch (error) {
    consola.error('[PRISMA] Error disconnecting from Prisma:', error);
  }
};

export { prisma, initPrisma, disconnectPrisma };
