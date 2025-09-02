import { Command } from '../../../utils/command.js';
import { snapsave } from '../../../utils/scrape/snapsave.js';

Command({
  name: 'downloader-facebook',
  description: 'Download media from facebook.',
  alias: ['fbdl', 'facebook', 'fesnuk'],
  tags : {
    label : 'downloader'
  },
  run: async ({ m }) => {
    let body = null;
    if (m.quoted) {
      body = m.quoted.content.text.match(/(https?):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|]/ig)[0] || null;
    } else {
      body = m.content.textWithoutCommand.trim();
    }
    if (!body) return m.reply(__('cmd.downloader.fb.ex', { command: m.content.command }));

    const res = await snapsave(body);

    m.react('⌛');
    if (res.ok) {
      await m.reply({
        video: { url: res.data.resolutions[0].url }, 
        caption: `*${res.data.title}* - ${res.data.resolutions[0].resolution}`
      }).then(() => m.react('✅'))
        .catch(() => m.react('❌'));
    } else {
      m.react('❌');
    }
  }
});