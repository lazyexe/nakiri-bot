const { Command } = require('../../../utils/command.js');
const snapsave = require('../../../utils/scrape/snapsave.js');

Command({
  name: 'downloader-instagram',
  description: 'Download media from instagram.',
  alias: ['igdl', 'instagram', 'insta'],
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
    if (!body) return m.reply(__('cmd.downloader.ig.ex', { command: m.content.command }));

    const res = await snapsave(body);

    m.react('⌛');
    if (res.ok) {
      await m.reply({
        video: { url: res.data.resolutions[0].url }
      }).then(() => m.react('✅'))
        .catch(() => m.react('❌'));
    } else {
      m.react('❌');
    }
  }
});