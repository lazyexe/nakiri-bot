import { Command } from '../../../utils/command.js';
import { imageToWebp, videoToWebp, writeExif } from '../../../utils/sticker.js';
import axios from 'axios';

Command({
  name: 'tools-media-to-sticker',
  description: 'Convert media to sticker.',
  alias: ['sticker', 's', 'stiker'],
  tags : {
    label : 'tools'
  },
  run: async ({ m }) => {
    let sticker = null;

    const [ packname, author ] = m.content.textWithoutCommand.split('|');

    if (m.quoted && m.quoted.content.isImage) {
      const media = await m.quoted.downloadMedia();
      sticker = await imageToWebp(media);  
    } else if (m.quoted && m.quoted.content.isVideo) {
      const media = await m.quoted.downloadMedia();
      sticker = await videoToWebp(media);  
    } else if (m.content.isImage) {
      const media = await m.downloadMedia();
      sticker = await imageToWebp(media);  
    } else if (m.content.isVideo) {
      const media = await m.downloadMedia();
      sticker = await videoToWebp(media);  
    } else if (m.quoted && m.quoted.content.isSticker) {
      sticker = await m.quoted.downloadMedia();
      if (!sticker) return m.reply(__('cmd.tools.mediaToSticker.failedDownloadSticker'));
    } else if (m.content.textWithoutCommand.startsWith('https://')) {
      try {
        const { data, headers } = await axios.get(m.content.textWithoutCommand, { responseType: 'arraybuffer' });
        switch (headers.get('content-type').split('/')[0]) {
        case 'image':
          sticker = await imageToWebp(data);
          break;
        case 'video':
        case 'gif':
          sticker = await videoToWebp(data);
          break;
        default:
          return m.reply(__('cmd.tools.mediaToSticker.typeNotSupported'));
        }
      } catch (e) {
        console.error(e);
        return m.reply(__('cmd.tools.mediaToSticker.failedFetchUrl'));
      }
    }

    if (!sticker) return m.reply(__('cmd.tools.mediaToSticker.ex', { command: m.content.command }));

    sticker = await writeExif(sticker, { packname: packname || 'Nakiri Sticker Maker', author: author || m?.pushName || 'Nakiri' });
    await m.sendMessage(m.chat, { sticker }, { quoted: m });
  }
});