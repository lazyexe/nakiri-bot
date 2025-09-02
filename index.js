import dotenv from 'dotenv';
dotenv.config();
import { consola } from 'consola';
import path from 'path';
import { URL } from 'url';

// global variables
global.__basedir = import.meta.dirname;
global.__storagedir = path.join(__basedir, 'storage');

// init I18n
import './app/utils/i18n.js';

// init prisma
import { initPrisma, disconnectPrisma } from './app/utils/prisma.js';
initPrisma();

// init currency
import currencyInstance from './app/utils/currency.js';
currencyInstance.init();

// init express
const { hostname, port } = new URL(process.env.APP_URL);
import AppExpress from './app/express/config.js';
const server = new AppExpress();
server.app.listen(port || 5570, hostname, () => {
  consola.success(`[EXPRESS] App Listening at ${process.env.APP_URL}`);
});

// init bot
import { createOrGet as WASocketCreateOrGet } from './app/bot/socket.js';
import { initCommands } from './app/utils/command.js';
(async () => {
  await initCommands();
  await WASocketCreateOrGet({ id: process.env.SESSION_NAME, usePairingCode: true });
})();

process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});
