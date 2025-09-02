import { Command } from '../../../utils/command.js';
import axios from 'axios';

Command({
  name: 'downloader-youtube',
  description: 'Download media from youtube.',
  alias: ['ytdl', 'youtube'],
  tags : {
    label : 'downloader'
  },
  run: async ({ m }) => {
    const body = m.content.textWithoutCommand.trim();
    const formats = ['144p', '240p', '360p', '480p'];
    const url = body.match(/(https?:\/\/[^\s]+)/g)?.[0];
    let format = body.match(/(144p|240p|360p|480p)/g)?.[0] || '360p';
    
    if (!url || !formats.includes(format)) return m.reply(__('cmd.downloader.ytdl.ex', { command: m.content.command, formats: formats.join(', ') }));

    m.react('⌛');

    try {
      const { data: downloadInit } = await axios.get('https://p.oceansaver.in/ajax/download.php?copyright=0&format=' + format.replace('p', '') + '&url=' + url);

      let downloadUrl = null;
      while (!downloadUrl) {
        let res = await axios.get(downloadInit.progress_url);
        downloadUrl = res.data.download_url;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      await m.reply({ 
        video: { url: downloadUrl },
        caption: `${downloadInit?.title} - ${format}`,
      }).then(() => m.react('✅'))
        .catch(() => m.react('❌'));
    } catch {
      m.react('❌');
    }
  }
});