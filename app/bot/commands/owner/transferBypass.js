import { Command } from '../../../utils/command.js';
import currencyInstance from '../../../utils/currency.js';
import * as luxon from 'luxon';

Command({
  name: 'owner-bypass-transfer',
  description: 'Transfer Bypass',
  alias: ['tfbypass'],
  tags : {
    label : 'owner'
  },
  run: async ({ m }) => {
    const [ amount, from, to ] = m.content.textWithoutCommand.split(' ');

    let fromJid = from?.replace(/[^0-9]/g, '');
    let toJid = to?.replace(/[^0-9]/g, '');

    if (!fromJid || !toJid) return m.reply(__('cmd.owner.transferBypass.ex', { command: m.content.command }));
    
    if (!fromJid.includes('@')) fromJid = fromJid + '@s.whatsapp.net';
    if (!toJid.includes('@')) toJid = toJid + '@s.whatsapp.net';

    try {
      const transaction = await currencyInstance.transfer({ fromJid, toJid, amount: Number(amount) });
      let text = '*`❖ Transfer Bypass`*\n';
      text += `▸ Sender : ${transaction.users.from.pushName}\n`;
      text += `▸ Receiver : ${transaction.users.to.pushName}\n`;
      text += `▸ Amount : ${transaction.amount}\n`;
      text += `▸ Fee : ${transaction.fee}\n`;
      m.reply(text);
    } catch (e) {
      return m.reply(e.message);
    }
  }
});