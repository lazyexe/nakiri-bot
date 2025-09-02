import { Command } from '../../../utils/command.js';

Command({
  name: 'tools-ping',
  description: 'Ping Bot',
  alias: ['ping', 'speed', 'p'],
  tags : {
    label : 'tools'
  },
  run: async ({ m }) => {
    let start = performance.now();
    m.reply(`${(performance.now() - start).toFixed(3)}ms`);
  }
});