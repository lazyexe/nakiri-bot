const currencyInstance = require('../../utils/currency.js');

module.exports = async function ({
  id,
  sock,
  reconnecting
}) {
  await require('./group.js')({
    id,
    sock
  });

  await require('./message.js')({
    id,
    sock
  });

  if (!reconnecting) {
    currencyInstance.ev.on('miner', async (event) => {
      const m = currencyInstance.messageHistoryMap.get(event.jid);
      if (m) {
        await sock.sendMessage(
          m.key.remoteJid,
          {
            react: {
              text: '✨',
              key: m.key
            }
          }
        );
        let totalFee = 0;
        let totalSupplyReward = 0;
        let text = 'Mining Stats\n\n';
        if (event.history.length > 0) {
          for (const history of event.history) {
            if (history.type == 'transaction') {
              totalFee = totalFee + history.transaction.fee;
              text += '▷ From Transaction\n';
              text += `> Id : ${history.transaction.id}\n`;
              text += `> Reward : ${history.transaction.fee}\n`;
              text += '\n';
            } else if (history.type == 'reward') {
              totalSupplyReward = totalSupplyReward + history.reward;
              text += '▷ From Supply Reward\n';
              text += `> Reward : ${history.reward}\n`;
              text += '\n';
            }
          }
        }
        text += '▷ Supply Reward: ' + totalSupplyReward + '\n';
        text += '▷ Transaction Reward: ' + totalFee;
        await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m, ephemeralExpiration: m.content.expiration });
        currencyInstance.messageHistoryMap.delete(event.jid);
      }
    });

    // currencyInstance.ev.on('transaction', async (event) => {
    //   for (const transaction of event.transactions) {
    //     const m = currencyInstance.messageHistoryMap.get(transaction.id);
    //     if (m) {
    //       let text = __('cmd.personal.transfer.success');
    //       await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m, ephemeralExpiration: m.content.expiration });
    //       currencyInstance.messageHistoryMap.delete(transaction.id);
    //     }
    //   }
    // });
  }
};
