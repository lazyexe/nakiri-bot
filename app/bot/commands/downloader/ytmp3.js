import { Command } from '../../../utils/command.js';
import axios from 'axios';

Command({
  name: 'downloader-ytmp3',
  description: 'Download mp3 from youtube.',
  alias: ['ytmp3'],
  tags : {
    label : 'downloader'
  },
  run: async ({ m }) => {
    const body = m.content.textWithoutCommand.trim();
    if (!body) return m.reply(__('cmd.downloader.ytmp3.ex', { command: m.content.command }));
    
    const url = body;
    const format = 'mp3';
    const { data: downloadInit } = await axios.get('https://p.oceansaver.in/ajax/download.php?copyright=0&format=' + format + '&url=' + url);
    const { data: downloadUrl } = await axios.get(downloadInit.progress_url);
    m.react('⌛');
    await m.reply({ 
      audio: { url: downloadUrl.download_url }, 
      mimetype: 'audio/mpeg', 
      fileName: `${downloadInit.title}.mp3` 
    }).then(() => m.react('✅'))
      .catch(() => m.react('❌'));
  }
});