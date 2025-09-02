import { Command } from '../../../utils/command.js';
import currencyInstance from '../../../utils/currency.js';

Command({
  name: 'bank-mine',
  description: 'Mining Coin.',
  alias: ['mining', 'mine'],
  tags : {
    label : 'personal'
  },
  run: async ({ m }) => {
    try {
      await currencyInstance.mine({ jid: m.senderJid, remainingMines: 1, m });
      currencyInstance.messageHistoryMap.set(m.senderJid, {
        key: m.key,
        message: m.message,
        content: m.content,
      });
      await m.react('🔍');
    } catch (e) {
      return m.reply(e.message);
    }
  }
});
