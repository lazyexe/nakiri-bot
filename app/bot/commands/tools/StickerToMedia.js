import { Command } from '../../../utils/command.js';

Command({
  name: 'tools-sticker-to-image',
  description: 'Convert sticker to image.',
  alias: ['toimg'],
  tags : {
    label : 'tools'
  },
  run: async ({ m }) => {
    let mediaBuffer = null;

    if (m.quoted && m.quoted.content.isSticker) {
      mediaBuffer = await m.quoted.downloadMedia();
    } else if (m.content.isSticker) {
      mediaBuffer = await m.downloadMedia();
    } else {
      return m.reply(__('cmd.tools.stickerToMedia.ex', { command: m.content.command }));
    }

    if (!mediaBuffer) return m.reply(__('cmd.tools.stickerToMedia.failedDownloadSticker'));

    await m.sendMessage(m.chat, { image: mediaBuffer }, { quoted: m });
  }
});

// Command({
//   name: 'tools-sticker-to-video',
//   description: 'Convert sticker to video.',
//   alias: ['tovid'],
//   tags : {
//     label : 'tools'
//   },
//   run: async ({ m }) => {
//     let mediaBuffer = null;

//     if (m.quoted && m.quoted.content.isSticker) {
//       mediaBuffer = await m.quoted.downloadMedia();
//     } else if (m.content.isSticker) {
//       mediaBuffer = await m.downloadMedia();
//     } else {
//       return m.reply(__('cmd.tools.stickerToMedia.video.ex', { command: m.content.command }));
//     }

//     if (!mediaBuffer) return m.reply(__('cmd.tools.stickerToMedia.failedDownloadSticker'));

//     await m.sendMessage(m.chat, { video: await webpToVideo(mediaBuffer) }, { quoted: m });
//   }
// });