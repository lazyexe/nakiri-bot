require('dotenv').config({});
const { URL } = require('url');
const { consola } = require('consola');
const path = require('path');

// global variables
global.__basedir = __dirname;
global.__storagedir = path.join(__basedir, 'storage');

// init I18n
require('./app/utils/i18n.js');

// init prisma
const { initPrisma, disconnectPrisma } = require('./app/utils/prisma.js');
initPrisma();

// init currency
const currencyInstance = require('./app/utils/currency.js');
currencyInstance.init();

// init express
const { hostname, port } = new URL(process.env.APP_URL);
const AppExpress = require('./app/express/config.js');
const server = new AppExpress();
server.app.listen(port || 5570, hostname, () => {
  consola.success(`[EXPRESS] App Listening at ${process.env.APP_URL}`);
});

// init bot
const wa = require('./app/bot/socket.js');
const { initCommands } = require('./app/utils/command.js');
(async () => {
  await initCommands();
  await wa.createOrGet({ id: process.env.SESSION_NAME, usePairingCode: true });
})();

process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});
