import { Command } from '../../../utils/command.js';
import currencyInstance from '../../../utils/currency.js';

Command({
  name: 'personal-transaction-history',
  description: 'Show history transaction',
  alias: ['transaction', 'trans'],
  tags : {
    label : 'personal'
  },
  run: async ({ m }) => {
    let jid = m.sender;

    const body = m.content.textWithoutCommand;

    if (m.content.mentionedJid.length) jid = m.content.mentionedJid[0];
    if (m.quoted) jid = m.quoted.sender;
    if (body) jid = body;

    if (!jid) return m.reply(__('cmd.personal.transaction.ex', { command: m.content.command }));

    if (!jid.includes('@')) jid = jid + '@s.whatsapp.net';

    try {
      const history = await currencyInstance.getHistory({ jid, page: 1, limit: 10 });
      if (history.length == 0) return m.reply(__('cmd.personal.transaction.noHistory'));
      let text = '*`❖ Transaction History`*\n\n';
      for (const transaction of history) {
        if (transaction.fromAddress == jid) {
          text += `> Transfer To : ${m.isGroup ? transaction.toAddress.split('@')[0].slice(0, 3) + 'xxx' : transaction.toAddress.split('@')[0]}\n`;
          text += `> Amount : ${transaction.amount}\n`;
          text += `> Fee : ${transaction.fee}\n\n`;
        } else {
          text += `> Receive From : ${m.isGroup ? transaction.fromAddress.split('@')[0].slice(0, 3) + 'xxx' : transaction.fromAddress.split('@')[0]}\n`;
          text += `> Amount : ${transaction.amount}\n`;
          text += `> Fee : ${transaction.fee}\n\n`;
        }
      }

      await m.reply(text);
    } catch (e) {
      console.log(e.message);
    }
  }
});
