import { Command, commands } from '../../utils/command.js';

Command({
  name: 'test',
  description: 'Test command',
  alias: ['test'],
  // eslint-disable-next-line no-unused-vars
  run: async ({ sock, m, options }) => {
    console.log(commands.entries());
  }
});
