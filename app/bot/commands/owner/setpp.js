import { Command } from '../../../utils/command.js';
import axios from 'axios';
import { S_WHATSAPP_NET } from 'baileys';
import sharp from 'sharp';

Command({
  name: 'owner-setpp',
  description: 'Set Profile Picture Bot',
  alias: ['setpp'],
  tags : {
    label : 'owner'
  },
  // eslint-disable-next-line no-unused-vars
  run: async ({ sock, m, options }) => {
    if (!m.isSenderOwner && !m.isSenderBot) return;

    try {
      let media = null;
      if (m.quoted && m.quoted.content.isImage) {
        media = await m.quoted.downloadMedia();
      } else if (m.content.textWithoutCommand) {
        let { data } = await axios.get(m.body.arg, { responseType: 'arraybuffer' });
        media = data;
      } else if (m.content.isImage) {
        media = await m.downloadMedia();
      } else {
        return m.reply('Invalid media.');
      }

      const { img } = await pepe(media);

      await sock.query({
        tag: 'iq',
        attrs: {
          to: S_WHATSAPP_NET,
          type: 'set',
          xmlns: 'w:profile:picture'
        },
        content: [
          {
            tag: 'picture',
            attrs: { type: 'image' },
            content: img
          }
        ]
      });

      m.reply('Success.');
    } catch (e) {
      m.reply(e.message || 'Something went wrong.');
    }
  }
});

const pepe = async function(media) {
  const image = sharp(media);
  const metadata = await image.metadata();
  const { width, height } = metadata;
  const size = Math.min(width, height);
	
  const croppedImage = image.extract({ left: 0, top: 0, width: size, height: size });

  const imgBuffer = await croppedImage.resize(720, 720).toFormat('jpeg').toBuffer();
  const previewBuffer = await croppedImage.normalize().toFormat('jpeg').toBuffer();
	
  return {
    img: imgBuffer,
    preview: previewBuffer
  };
};