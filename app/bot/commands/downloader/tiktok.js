const { default: got } = require('got');
const { Command } = require('../../../utils/command.js');

Command({
  name: 'downloader-tiktok',
  description: 'Download media from tiktok.',
  alias: ['ttdl', 'tiktok'],
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
    if (!body) return m.reply(__('cmd.downloader.tt.ex', { command: m.content.command }));
    // if (!(/^(https?:\/\/)?(www\.|m\.|vm\.|vt\.)?(tiktok\.com|bytef\.ly)(\/@[\w\d\.]+\/?|\/v\/[\w\d\.]+\.html|\/video\/\d+|\/[a-zA-Z0-9_\-]{8,15}|(\/@[\w\d\.]+)?\/video\/\d+)*(\?[\w=&%-]*)?(#.*)?$/i).test(body)) return m.reply(__('cmd.downloader.fb.ex', { command: m.content.command }));

    const res = await got.get(`https://www.tikwm.com/api/?url=${body}?hd=1`).json();

    m.react('⌛');
    if (res.code == 0) {
      await m.reply({
        video: { url: res.data.play }, 
        caption: `${res.data.title}`
      }).then(() => m.react('✅'))
        .catch(() => m.react('❌'));
    } else {
      m.react('❌');
    }
  }
});