import { Command } from '../../../utils/command.js';
import AnonymousChat from '../../../utils/AnonymousChat.js';
import currencyInstance from '../../../utils/currency.js';
import { prisma } from '../../../utils/prisma.js';
import os from 'os';

Command({
  name: 'other-statistic-info-bot',
  description: 'About',
  alias: ['info', 'system', 'about', 'author'],
  tags : {
    label : 'tools'
  },
  run: async ({ m, sock }) => {
    const AnonChat = new AnonymousChat({ m });
    const info = await AnonChat.info();
    let start = performance.now();
    const currency = await currencyInstance.statusInfo();

    let text = '*`❖ BOT`*\n';
    text += `▷ Total Group : ${Object.keys(await sock.groupFetchAllParticipating()).length.toLocaleString()}\n`;
    text += `▷ Registered User : ${await prisma.User.count()}\n`;
    text += `▷ Prefix : ${m.db.bot.prefixes.join(' ')}\n`;
    text += '\n';
    text += '*`❖ Anonymous Chat`*\n';
    text += `▷ User In Queue : ${info.users.inQueue.toLocaleString()}\n`;
    text += `▷ User In Chat : ${info.users.inChat.toLocaleString()}\n`;
    text += `▷ Total User Online : ${info.users.total.toLocaleString()}\n`;
    text += '\n';
    text += '*`❖ Currency Stats`*\n';
    text += `▷ Chain : ${currency.validateCirculation.status ? 'Valid' : 'Invalid'}\n`;
    text += `▷ Supply Mined : ${currency.metadata.supplyPercentage}\n`;
    text += '\n';
    text += '*`❖ OWNER`*\n';
    m.db.bot.owners.forEach((v) => text += `▷ ${v}\n`);
    text += '\n';
    text += '*`❖ Server Info`*\n';
    text += `▷ Running On : ${process.env.username === 'root' ? 'LINUX' : 'WINDOWS'}\n`;
    text += `▷ Node Version : ${process.version}\n`;
    text += `▷ Speed : ${(performance.now() - start).toFixed(5)} ms\n`;
    text += `▷ Uptime : ${toTime(process.uptime() * 1000)}\n`;
    text += `▷ Total Memory : ${formatSize(os.freemem())}/${formatSize(os.totalmem())}\n`;
    text += `▷ CPU : ${os.cpus()[0].model} ( ${os.cpus().length} CORE )\n`;
    text += `▷ Release : ${os.release()}\n`;
    text += `▷ Type : ${os.type()}\n`;
    text += '\n';
    text += '> Version: 1.0.0';
    m.reply(text);
  }
});

const toTime = (ms) => {
  let seconds = Math.floor((ms / 1000) % 60);
  let minutes = Math.floor((ms / (1000 * 60)) % 60);
  let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  let days = Math.floor(ms / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const formatSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};