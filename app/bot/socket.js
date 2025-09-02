import {
  makeWASocket,
  Browsers,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  useMultiFileAuthState,
} from 'baileys';
import { consola } from 'consola';
import pino from 'pino';
import usePrismaAuthState from '../utils/usePrismaAuthState.js';
import QRCode from 'qrcode';
import QRTerminal from 'qrcode-terminal';
import NodeCache from 'node-cache';
import eventHandler from './event/index.js';
import fs from 'fs';

const SESSIONS = new Map();
const TIMEOUTS = new Map();

export const get = (id) => {
  return SESSIONS.get(id) || null;
};

export const createOrGet = async ({
  id,
  usePairingCode = false,
  reconnecting = false,
  socket = null
}) => {
  if(SESSIONS.has(id) && !reconnecting) {
    return SESSIONS.get(id);
  }

  const [ deviceId, deviceNumber ] = id.split('-');
  const { state, saveCreds } = process.env.NODE_ENV === 'production' ? await usePrismaAuthState({ session: id }) : await useMultiFileAuthState(`${__storagedir}/baileys/${id}`);
  const groupCache = new NodeCache({ stdTTL: 300 });

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    browser: Browsers.windows('Chrome'),
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    // shouldSyncHistoryMessage: (msg) => {
    //   console.log(msg);
    // },
    cachedGroupMetadata: async (jid) => groupCache.get(jid) || null,
  });

  SESSIONS.set(id, sock);

  sock.setGroupCache = (id, metadata) => groupCache.set(id, metadata);
      
  sock.getGroupCache = async (id) => {
    if(groupCache.has(id)) {
      return groupCache.get(id);
    } else {
      const metadata = await sock.groupMetadata(id);
      groupCache.set(id, metadata);
      return metadata;
    }
  };
      
  sock.delGroupCache = (id) => groupCache.del(id);

  const clearConnectionTimeout = () => {
    if (TIMEOUTS.has(id)) {
      clearTimeout(TIMEOUTS.get(id));
      TIMEOUTS.delete(id);
    }
  };

  const setConnectionTimeout = () => {
    clearConnectionTimeout();

    const timeoutId = setTimeout(async () => {
      consola.warn(`[WA: ${id}] Connection timeout reached (40 seconds). Auto destroying session...`);
      socket?.emit('device:status', {
        id: deviceId,
        type: 'connection:timeout',
        ok: false,
        message: 'Connection timeout. Session destroyed automatically.',
      });
      await destroy(id);
    }, 40000); // 40 detik

    TIMEOUTS.set(id, timeoutId);
    consola.info(`[WA: ${id}] Connection timeout set/reset for 40 seconds.`);
  };

  sock.ev.on('creds.update', saveCreds);

  if (usePairingCode && !sock.authState.creds.registered) {
    try {
      setTimeout(async () => {
        const code = await sock.requestPairingCode(deviceNumber);
        socket?.emit('device:status', {
          id: deviceId,
          type: 'connection:pairing',
          message: 'Pairing Code Received',
          data: {
            code,
            timeout: 40000
          }
        });
        consola.success(`[WA: ${id}] Pairing Code: ${code}`);
        setConnectionTimeout();
      }, 5000);
    } catch (error) {
      consola.error(`[WA: ${id}] Error requesting pairing code: ${error.message}`);
      socket?.emit('device:status', {
        id: deviceId,
        type: 'connection:pairing',
        ok: false,
        message: 'Error requesting pairing code',
      });
    }
  }

  sock.ev.on('connection.update', async (update) => {
    try {
      const { connection, lastDisconnect, qr } = update;

      sock.status = connection;

      if(qr && !usePairingCode) {
        socket?.emit('device:status', {
          id: deviceId,
          type: 'connection:qr',
          message: 'QR Code Received',
          data: {
            qr: await QRCode.toDataURL(qr),
            timeout: 40000
          }
        });
        QRTerminal.generate(qr, { small: true });
        consola.success(`[WA: ${id}] QR Code Received.`);
        setConnectionTimeout();
      }

      if(connection === 'close') {
        const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut && lastDisconnect.error?.output?.statusCode !== DisconnectReason.badSession);
        // const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
        consola.warn('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);

        if(shouldReconnect) {
          socket?.emit('device:status', {
            id: deviceId,
            type: 'connection:reconnecting',
            ok: true,
            message: 'Reconnecting.',
          });
          await createOrGet({
            id,
            usePairingCode,
            reconnecting: true,
            socket
          });
        } else {
          const logout = await destroy(id);
          socket?.emit('device:status', {
            id: deviceId,
            type: 'connection:logout',
            ok: logout.ok,
            message: logout.message
          });
        }
      } else if (connection === 'connecting') {
        consola.success(`[WA: ${id}] Connecting...`);
        socket?.emit('device:status', {
          id: deviceId,
          type: 'connection:connecting',
          ok: true,
          message: 'Connecting...',
        });
      } else if(connection === 'open') {
        consola.success(`[WA: ${id}] Connection Opened.`);
        socket?.emit('device:status', {
          id: deviceId,
          type: 'connection:open',
          ok: true,
          message: 'Connected.',
        });
        clearConnectionTimeout();
      }
    } catch (error) {
      consola.error(`[WA: ${id}] Connection Update Error: ${error.message}`);
    }
  });

  await eventHandler({
    id,
    sock,
    reconnecting
  });
      
  return sock;
};

export const destroy = async (id) => {
  const sock = SESSIONS.get(id);
  if (sock) {
    try {
      consola.info(`[WA: ${id}] Session logged out or corrupted. Initiating cleanup...`);

      sock.ev.removeAllListeners();

      if (process.env.NODE_ENV === 'production') {
        const { removeCreds } = await usePrismaAuthState({
          session: id,
        });
        removeCreds();
      } else {
        fs.unlinkSync(`${__storagedir}/baileys/${id}/creds.json`);
      }
      consola.info(`[WA: ${id}] Creds removed.`);

      SESSIONS.delete(id);
      consola.info(`[WA: ${id}] Session ID removed from global list.`);

      try {
        await sock.logout();
        consola.success(`[WA: ${id}] Successfully sent logout signal to WhatsApp.`);
      } catch (logoutError) {
        consola.warn(`[WA: ${id}] Error during sock.logout(): ${logoutError.message}. This is common if connection is already closed/corrupted.`);
      }

      sock.end();
      consola.success(`[WA: ${id}] Socket connection ended.`);
      return {
        ok: true,
        message: 'Session destroyed successfully.'
      };
    } catch (cleanupError) {
      consola.error(`[WA: ${id}] An unexpected error occurred during session cleanup:`, cleanupError);
      return {
        ok: false,
        message: cleanupError
      };
    }
  } else {
    return {
      ok: false,
      message: 'Session not found.'
    };
  }
};

export const bot = async (id) => {
  return get(id);
};