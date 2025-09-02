import { Command } from '../../../utils/command.js';
import currencyInstance from '../../../utils/currency.js';

Command({
  name: 'bank-holder',
  description: 'Holder Currency',
  alias: ['holder'],
  tags : {
    label : 'personal'
  },
  run: async ({ m }) => {
    try {
      const result = await currencyInstance.getHolder();
      let text = '*`❖ Holder`*\n';
      for (const holder of result) {
        text += `▸ ${holder.pushName} : ${currencyInstance.roundAmount(holder.balance).toLocaleString()}\n`;
      }
      m.reply(text);
    } catch (e) {
      return m.reply(e.message);
    }
  }
});
