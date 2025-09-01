const { Command } = require('../../../utils/command.js');
const currencyInstance = require('../../../utils/currency.js');

Command({
  name: 'currency-info',
  description: 'Show Stats Currency',
  alias: ['currency'],
  tags : {
    label : 'personal'
  },
  run: async ({ m }) => {
    const currency = await currencyInstance.statusInfo();
    
    let text = '*❖ Currency Info*\n';
    text += `▷ Miner Active : ${currency.totalMiners.toLocaleString()}\n`;
    text += `▷ Supply : ${currency.metadata.maxSupply.toLocaleString()}\n`;
    text += `▷ Supply Mined : ${currency.metadata.currentSupply.toLocaleString()}\n`;
    text += `▷ Supply Percentage : ${currency.metadata.supplyPercentage}\n`;
    text += `▷ Current Reward : ${currency.metadata.currentReward.toLocaleString()}\n`;
    text += `▷ Chain : ${currency.validateCirculation.status ? 'Valid' : 'Invalid'}\n`;
    text += `▷ Circulation : ${currency.validateCirculation.inCirculation.toLocaleString()}`;

    await m.reply(text);
  }
});
