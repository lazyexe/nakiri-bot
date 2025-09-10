import { prisma } from './prisma.js';
import curve from 'baileys/node_modules/libsignal/src/curve.js';
import { randomBytes, randomUUID } from 'crypto';

const usePrismaAuthState = async ({ session, tableName = 'DeviceAuth' }) => {
  if (!session) {
    throw new Error('Session name is required.');
  }

  const readData = async id => {
    const record = await prisma[tableName].findUnique({
      where: {
        session_key: {
          session: session,
          key: id,
        },
      },
    });

    if (!record || !record.value) {
      return null;
    }

    const creds =
      typeof record.value === 'object'
        ? JSON.stringify(record.value)
        : record.value;
    const credsParsed = JSON.parse(creds, BufferJSON.reviver);
    return credsParsed;
  };

  const writeData = async (id, value) => {
    const valueFixed = JSON.stringify(value, BufferJSON.replacer);
    await prisma[tableName].upsert({
      where: {
        session_key: {
          session: session,
          key: id,
        },
      },
      create: {
        session: session,
        key: id,
        value: valueFixed,
      },
      update: {
        value: valueFixed,
      },
    });
  };

  const removeData = async id => {
    await prisma[tableName].delete({
      where: {
        session_key: {
          session: session,
          key: id,
        },
      },
    });
  };

  const clearAll = async () => {
    await prisma[tableName].deleteMany({
      where: {
        key: { not: 'creds' },
        session: session,
      },
    });
  };

  const removeAll = async () => {
    await prisma[tableName].deleteMany({
      where: {
        session: session,
      },
    });
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds: creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          for (const id of ids) {
            let value = await readData(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              value = fromObject(value);
            }
            data[id] = value;
          }
          return data;
        },
        set: async data => {
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const name = `${category}-${id}`;
              if (value) {
                await writeData(name, value);
              } else {
                await removeData(name);
              }
            }
          }
        },
      },
    },
    saveCreds: async () => {
      await writeData('creds', creds);
    },
    clear: async () => {
      await clearAll();
    },
    removeCreds: async () => {
      await removeAll();
    },
    query: async (sql, values) => {
      console.log('query:', sql, values);
      return null;
    },
  };
};

const generateKeyPair = () => {
  const { pubKey, privKey } = curve.generateKeyPair();
  return {
    private: Buffer.from(privKey),
    public: Buffer.from(pubKey.slice(1)),
  };
};

const generateSignalPubKey = pubKey => {
  return pubKey.length === 33
    ? pubKey
    : Buffer.concat([Buffer.from([5]), pubKey]);
};

const sign = (privateKey, buf) => {
  return curve.calculateSignature(privateKey, buf);
};

const signedKeyPair = (identityKeyPair, keyId) => {
  const preKey = generateKeyPair();
  const pubKey = generateSignalPubKey(preKey.public);
  const signature = sign(identityKeyPair.private, pubKey);
  return { keyPair: preKey, signature, keyId };
};

const allocate = str => {
  let p = str.length;

  if (!p) {
    return new Uint8Array(1);
  }

  let n = 0;

  while (--p % 4 > 1 && str.charAt(p) === '=') {
    ++n;
  }

  return new Uint8Array(Math.ceil((str.length * 3) / 4) - n).fill(0);
};

const parseTimestamp = timestamp => {
  if (typeof timestamp === 'string') {
    return parseInt(timestamp, 10);
  }

  if (typeof timestamp === 'number') {
    return timestamp;
  }

  return timestamp;
};

const fromObject = args => {
  const f = {
    ...args.fingerprint,
    deviceIndexes: Array.isArray(args.fingerprint.deviceIndexes)
      ? args.fingerprint.deviceIndexes
      : [],
  };

  const message = {
    keyData: Array.isArray(args.keyData) ? args.keyData : new Uint8Array(),
    fingerprint: {
      rawId: f.rawId || 0,
      currentIndex: f.rawId || 0,
      deviceIndexes: f.deviceIndexes,
    },
    timestamp: parseTimestamp(args.timestamp),
  };

  if (typeof args.keyData === 'string') {
    message.keyData = allocate(args.keyData);
  }

  return message;
};

const BufferJSON = {
  replacer: (_, value) => {
    if (value?.type === 'Buffer' && Array.isArray(value?.data)) {
      return {
        type: 'Buffer',
        data: Buffer.from(value?.data).toString('base64'),
      };
    }
    return value;
  },
  reviver: (_, value) => {
    if (value?.type === 'Buffer') {
      return Buffer.from(value?.data, 'base64');
    }
    return value;
  },
};

const initAuthCreds = () => {
  const identityKey = generateKeyPair();
  return {
    noiseKey: generateKeyPair(),
    pairingEphemeralKeyPair: generateKeyPair(),
    signedIdentityKey: identityKey,
    signedPreKey: signedKeyPair(identityKey, 1),
    registrationId: Uint16Array.from(randomBytes(2))[0] & 16383,
    advSecretKey: randomBytes(32).toString('base64'),
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSyncCounter: 0,
    accountSettings: {
      unarchiveChats: false,
    },
    deviceId: Buffer.from(randomUUID().replace(/-/g, ''), 'hex').toString(
      'base64url'
    ),
    phoneId: randomUUID(),
    identityId: randomBytes(20),
    backupToken: randomBytes(20),
    registered: false,
    registration: {},
    pairingCode: undefined,
    lastPropHash: undefined,
    routingInfo: undefined,
  };
};

export default usePrismaAuthState;
