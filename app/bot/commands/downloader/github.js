const { Command } = require('../../../utils/command.js');

Command({
  name: 'downloader-github',
  description: 'Download source code from github.',
  alias: ['gitclone', 'gitdl', 'github'],
  tags: { label: 'downloader' },
  run: async ({ m }) => {
    try {
      let url = null;
      if (m.quoted) {
        url = m.quoted.content.text.match(/(https?):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|]/ig)[0] || null;
      } else {
        url = m.content.textWithoutCommand.trim();
      }
      if (!url) return m.reply(__('cmd.downloader.github.ex', { command: m.content.command }));
      if (!url.startsWith('https://github.com/')) return m.reply(__('cmd.downloader.github.ex', { command: m.content.command }));
      if (url.endsWith('.git')) url = url.slice(0, -4);
    
      const branch = (url.match(/github\.com\/[^/]+\/[^/]+(?:\/tree\/([^/]+))?/)?.[1]) || 'master';
      if (branch !== 'master') url = url.replace(`/tree/${branch}`, '');
    
      const zipUrl = `${url}/archive/refs/heads/${branch}.zip`;
    
      m.react('⌛');
      await m.reply({
        document: { url: zipUrl },
        fileName: `${url.split('/').pop()}.zip`,
        mimetype: 'application/zip',
      }).then(() => m.react('✅'))
        .catch(() => m.react('❌'));
    } catch (e) {
      console.log(e);
      m.react('❌');
    }
  }
});
