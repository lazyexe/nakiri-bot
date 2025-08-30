const { Command, tags, commands } = require('../../utils/command.js');
const { DateTime } = require('luxon');

Command({
  name: 'menu',
  description: 'Show menu',
  alias: ['help', 'menu'],
  run: async ({ m }) => {
    let highlightMenu = [
      'anonymouschat-start',
      'tools-media-to-sticker',
      'tools-sticker-to-image',
      'tools-notes'
    ];
    let text = '';
    let label = __('cmd.menu.all');
    text += __('cmd.menu.welcome', { name: m.pushName, time: time2() });
    text += '\n\n';
    text += __('cmd.menu.description', { command: m.content.prefix + 'start' });
    text += '\n\n';
    text += String.fromCharCode(8206).repeat(4001);
    if (highlightMenu.length > 0) {
      text += '`❖ HIGHLIGHT MENU`\n';
      for (let i = 0; i < highlightMenu.length; i++) {
        const command = commands.get(highlightMenu[i]);
        if (!command) continue;
        text += `▷  ${m.content.prefix + command.alias[0]} ${command?.example ? '_' + command.example + '_' : ''}\n`;
      }
      text += '\n';
    }
    if(m.content.textWithoutCommand) {
      let filterMenu = tags.get(m.content.textWithoutCommand.toLowerCase());
      if(!filterMenu) return;
      label = m.content.textWithoutCommand.toUpperCase();
      text += `\`❖ ${label}\`\n`;
      filterMenu.forEach((v) => {
        text += `▷  ${m.content.prefix + v.alias[0]} ${v?.example ? '_' + v.example + '_' : ''}\n`;
      });
    } else {
      tags.forEach((val, key) => {
        if (key.toLowerCase() === 'owner') return;
        text += `\`❖ ${key.toUpperCase()}\`\n`;
        val.forEach((v) => {
          text += `▷  ${m.content.prefix + v.alias[0]} ${v?.example ? '_' + v.example + '_' : ''}\n`;
        });
        text += '\n';
      });
    }
    text += '\n';

    text += `> ${__('cmd.menu.footer', { command: m.content.prefix + 'info' })}`;

    await m.sendMessage(m.chat, { text });
  }
});

const time2 = () => {
  const hour = DateTime.local().setZone('Asia/Jakarta').hour;

  if (hour >= 5 && hour < 11) return __('cmd.menu.time.morning');
  if (hour >= 11 && hour < 15) return __('cmd.menu.time.afternoon');
  if (hour >= 15 && hour < 18) return __('cmd.menu.time.evening');
  return __('cmd.menu.time.night');
};
