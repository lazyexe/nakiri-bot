import { isJidUser } from 'baileys';
import AnonymousChat from '../../utils/AnonymousChat.js';

export const handler = async (sock, m, $next) => {
  if (m.isSenderBot) return $next;
  if (m.isGroup) return $next;
  if (!isJidUser(m.sender)) return $next;

  const anonchat = new AnonymousChat({ m });
  const chat = anonchat.map.get(m.sender);
  if (!chat) return $next;

  let command = false;

  if (m.db.bot.prefixes.includes(m.content.prefix) && m.content.commandWithoutPrefix == 'start') {
    await anonchat.start(m.sender);
    command = true;
  }

  if (m.db.bot.prefixes.includes(m.content.prefix) && m.content.commandWithoutPrefix == 'stop') {
    await anonchat.stop(m.sender);
    command = true;
  }

  if (m.db.bot.prefixes.includes(m.content.prefix) && m.content.commandWithoutPrefix == 'skip') {
    await anonchat.skip(m.sender);
    command = true;
  }

  if (chat.status == 'in-chat' && chat.matchWith && !command) {
    switch (m.mtype) {
    case 'extendedTextMessage':
    case 'conversation':
      await sock.sendMessage(chat.matchWith, { text: m.content.text });
      break;
    case 'imageMessage':
      await sock.sendMessage(chat.matchWith, { image: await m.downloadMedia(), caption: m.content.text });
      break;
    case 'stickerMessage':
      const sticker = await m.downloadMedia();
      // if (!sticker) return m.reply(__('anonymousChat.failedToDownloadSticker'));
      if (!sticker) return;
      await sock.sendMessage(chat.matchWith, { sticker });
      break;
    default:
      await m.reply(__('anonymousChat.messageTypeNotSupported'));
      break;
    }
  }

  throw {
    break: true,
    continueCommand: false,
    message: 'Anonymous Chat',
    hideLogs: true
  };
};