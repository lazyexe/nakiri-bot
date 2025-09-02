import { Command } from '../../../utils/command.js';
import util from 'util';
import {
  exec
} from 'child_process';

Command({
  name: 'owner-eval',
  description: 'Run Code JavaScript',
  alias: ['~'],
  withoutPrefix: true,
  tags : {
    label : 'owner'
  },
  // eslint-disable-next-line no-unused-vars
  run: async ({ sock, m, options }) => {
    if (!m.isSenderOwner && !m.isSenderBot) return;
    if (!m.content.textWithoutCommand) return;

    try {
      const result = await eval(`(async() => { ${m.content.textWithoutCommand} })()`);
      m.reply(util.format(result));
    } catch (e) {
      m.reply(util.format(e));
    }
  }
});

Command({
  name: 'owner-exec',
  description: 'Run Terminal Command',
  alias: ['$'],
  withoutPrefix: true,
  run: async ({ m }) => {
    if (!m.isSenderOwner && !m.isSenderBot) return;
    if (!m.content.textWithoutCommand) return;

    let {
      key
    } = await m.sendMessage(
      m.chat, {
        text: 'executed...',
      }, {
        quoted: m,
      },
    );

    exec(m.content.textWithoutCommand, async (err, stdout) => {
      if (err)
        return await m.sendMessage(m.chat, {
          text: util.format(err),
          edit: key,
        });
      if (stdout)
        return await m.sendMessage(m.chat, {
          text: stdout,
          edit: key,
        });
    });
  }
});