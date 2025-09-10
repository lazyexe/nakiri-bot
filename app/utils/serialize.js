import {
  normalizeMessageContent,
  jidNormalizedUser,
  getContentType,
  isJidGroup,
  downloadMediaMessage,
  isLidUser
} from 'baileys';
import { consola } from 'consola';
import { prisma } from '../utils/prisma.js';
import { GROUP_DEFAULT } from '../utils/schemaData.js';

const MEDIA_TYPE = [ 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage' ];
let cacheBotDatabase = null;

export default async function ({ sock, WAMessage }) {
  const normalizedMessages = {
    ...WAMessage,
    message: normalizeMessageContent(WAMessage.message),
  };
  const { key, message, broadcast, ...messages } = normalizedMessages;
  const dbBot = await fetchBotFromDatabase();
  
  const chat = key.remoteJid;
  const botJid = jidNormalizedUser(sock?.user?.id);
  const botLid = jidNormalizedUser(sock?.user?.lid);
  const isGroup = isJidGroup(chat);
  const groupMetadata = isGroup ? await sock.getGroupCache(chat) : {};
  const dbGroup = isGroup ? await fetchGroupFromDatabase(groupMetadata) : null;
  
  const senderJid = isGroup || broadcast ? (isLidUser(key.participant) ? jidNormalizedUser(key.participantAlt) : key.participant) : (key.fromMe ? botJid : isLidUser(key.remoteJid) ? jidNormalizedUser(key.remoteJidAlt) : key.remoteJid);
  const senderLid = isGroup || broadcast ? (isLidUser(key.participant) ? key.participant : jidNormalizedUser(key.participantAlt)) : (key.fromMe ? botLid : isLidUser(key.remoteJid) ? key.remoteJid : jidNormalizedUser(key.remoteJidAlt));
  const sender = senderJid;
  
  const isSenderOwner = dbBot.owners.some((owner) => owner == sender?.split('@')[0]) || false;

  const mtype = getContentType(message);
  const content = getMessageContent(message, dbBot.prefixes);
  const quoted = await getQuotedMessage({ message, key, botLid, sock, dbBot });

  return {
    key,
    chat,
    pushName: messages.pushName,
    botJid,
    botLid,
    fromMe: key.fromMe,
    sender,
    senderJid,
    senderLid,

    isGroup,
    isSenderBot: Boolean(senderJid === botJid),
    isSenderOwner,
    isSenderSuperAdmin: isGroup && hasParticipantRole(groupMetadata, senderLid, ['superadmin']) || isSenderOwner || false,
    isSenderAdmin: isGroup && hasParticipantRole(groupMetadata, senderLid, ['admin', 'superadmin']) || isSenderOwner || false,
    isBotSuperAdmin: isGroup && hasParticipantRole(groupMetadata, botLid, ['superadmin']) || false,
    isBotAdmin: isGroup && hasParticipantRole(groupMetadata, botLid, ['admin', 'superadmin']) || false,

    groupMetadata,
    content,
    mtype,
    message,
    quoted,
    lang: process.env.APP_LOCALE,
    db: {
      bot: dbBot,
      group: dbGroup
    },

    sendMessage: async function (chat, content, options = {}) {
      if (!options?.ephemeralExpiration) {
        options = { ...options, ephemeralExpiration: this.content.expiration };
      }
      if (!content?.mentions) {
        content = { ...content, mentions: this.parseMention(content?.text || content?.caption || '') };
      }
      return await sock.sendMessage(chat, content, options);
    },

    reply: async function (text, options = {}) {
      if (!options?.ephemeralExpiration) {
        options = { ...options, quoted: this, ephemeralExpiration: this.content.expiration };
      }
      return await sock.sendMessage(this.chat, (typeof text === 'object') ? text : { text, mentions: this.parseMention(text) }, options);
    },

    react: async function (params) {
      if (typeof params == 'string') {
        return await sock.sendMessage(
          this.chat,
          {
            react: {
              text: params,
              key: this.key
            }
          }
        );
      } else {
        if (!params?.chat) throw new Error('Missing chat.');
        if (!params?.emoji) throw new Error('Missing emoji.');
        if (!params?.key) throw new Error('Missing chat.');

        return await sock.sendMessage(
          params.chat,
          {
            react: {
              text: params.emoji,
              key: params.key
            }
          }
        );
      }
    },

    downloadMedia: async function (message) {
      try {
        return await downloadMediaMessage(
          message ?? this, 
          'buffer', 
          {}, 
          {
            logger: sock.ws.config.logger,
            reuploadRequest: sock.updateMediaMessage
          }
        );
      } catch (error) {
        consola.error(`[SERIALIZE]: Error downloading media: ${error.message}.`);
        return null;
      }
    },

    parseMention: function (text) {
      return (
        [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
          (v) => v[1] + '@s.whatsapp.net'
        ) || []
      );
    },
  };
};

const getText = (message) => {
  return (
    message?.conversation ||
        message?.extendedTextMessage?.text ||
        message?.imageMessage?.caption ||
        message?.videoMessage?.caption ||
        message?.documentMessage?.caption ||
        message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
        message?.ephemeralMessage?.message?.conversation ||
        message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
        message?.ephemeralMessage?.message?.imageMessage?.caption ||
        message?.ephemeralMessage?.message?.videoMessage?.caption ||
        message?.ephemeralMessage?.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
        message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation ||
        message?.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
        ''
  );
};

const getMessageContent = (message, prefixes = []) => {
  const mtype = getContentType(message);
  const text = getText(message);
    
  return {
    prefix: prefixes.find(p => text.startsWith(p)) || null,
    text,
    textWithoutCommand: text.includes(' ') ? text.slice(text.indexOf(' ') + 1) : '',
    command: text.split(' ')[0].trim(),
    commandWithoutPrefix: text.split(' ')[0].replace(new RegExp(`^[${prefixes.join('')}]`), ''),
    mentionedJid: message[mtype]?.contextInfo?.mentionedJid || [],
    expiration: message[mtype]?.contextInfo?.expiration || 0,
    isText: mtype === 'conversation' || mtype === 'extendedTextMessage',
    isSticker: mtype === 'stickerMessage',
    isImage: mtype === 'imageMessage',
    isVideo: mtype === 'videoMessage',
    isAudio: mtype === 'audioMessage',
    isDocument: mtype === 'documentMessage',
    isMedia: MEDIA_TYPE.includes(mtype),
  };
};

const getQuotedMessage = async ({ message, key, botLid, sock, dbBot }) => {
  const mtype = getContentType(message);
  const messageContent = message?.[mtype];
  const contextInfo = messageContent?.contextInfo || null;
  const Quoted = contextInfo?.quotedMessage || null;
  if (!Quoted) return null;
  const quotedMessage = normalizeMessageContent(Quoted);
  const type = getContentType(quotedMessage);
  const content = getMessageContent(quotedMessage, dbBot.prefixes);

  return {
    key: {
      remoteJid: key?.remoteJid,
      remoteJidAlt: undefined,
      fromMe: Boolean(botLid == key?.remoteJid),
      id: contextInfo.stanzaId,
      participant: isJidGroup(key?.remoteJid) ? contextInfo?.participant : undefined,
      participantAlt: undefined
    },
    chat: key?.remoteJid,
    sender: contextInfo?.participant,
    content,
    mtype: type,
    message: quotedMessage,
    downloadMedia: async function (message) {
      try {
        return await downloadMediaMessage(
          message ?? this, 
          'buffer', 
          {}, 
          {
            logger: sock.ws.config.logger,
            reuploadRequest: sock.updateMediaMessage
          }
        );
      } catch (error) {
        consola.error(`[SERIALIZE]: Error downloading media: ${error.message}.`);
        return null;
      }
    },
  };
};

const fetchBotFromDatabase = async () => {
  if (cacheBotDatabase) return cacheBotDatabase;
  const bot = await prisma.Bot.findFirst({});
  cacheBotDatabase = {...bot, clearCache: function () { cacheBotDatabase = null; }};
  return cacheBotDatabase;
};

const fetchGroupFromDatabase = async (groupMetadata) => {
  return await prisma.Group.upsert({
    where: { groupId: groupMetadata.id },
    update: {},
    create: {
      ...GROUP_DEFAULT,
      groupId: groupMetadata.id,
      subject: groupMetadata.subject,
      joinApprovalMode: groupMetadata.joinApprovalMode,
      lang: groupMetadata?.owner_country_code == 'ID' ? 'id' : groupMetadata?.subjectOwnerJid?.startsWith('62') ? 'id' : groupMetadata?.subjectOwner?.startsWith('62') ? 'id' : 'en'
    },
  });
};

const hasParticipantRole = (groupMetadata, lid, role = []) => {
  const participant = groupMetadata.participants.find((participant) => (groupMetadata.addressingMode == 'lid') ? participant.id === lid : participant.lid === lid);
  return participant ? role.includes(participant?.admin || 'user') : false;
};