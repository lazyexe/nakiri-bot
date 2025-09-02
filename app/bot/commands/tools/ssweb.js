import { Command } from '../../../utils/command.js';

Command({
  name: 'tools-ssweb',
  description: 'Screenshot website.',
  alias: ['ssweb'],
  tags : {
    label : 'tools'
  },
  run: async ({ m }) => {
    const match = /(hp|pc|web|tablet)?\s*(https?:\/\/\S+)/.exec(m.content.textWithoutCommand.trim());
    if (!match) return m.reply(__('cmd.tools.ssweb.ex', { command: m.content.command }));

    let layout = match[1] || 'web';
    let url = match[2] || null;

    if (!url) return m.reply(__('cmd.tools.ssweb.ex', { command: m.content.command }));

    let width, crop;
    switch (layout) {
    case 'web':
      width = 1900; crop = 1000; 
      break;
    case 'hp':
      width = 720; crop = 1280; 
      break;
    case 'pc':
      width = 1366; crop = 768; 
      break;
    case 'tablet':
      width = 800; crop = 1280; 
      break;
    }

    let screenshot = `https://image.thum.io/get/width/${width}/crop/${crop}/${url}`;

    m.react('⌛');
    await m.reply({ image: { url: screenshot } })
      .then(() => m.react('✅'))
      .catch(() => m.react('❌'));
  }
});