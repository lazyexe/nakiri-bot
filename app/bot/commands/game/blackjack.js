const { Command } = require('../../../utils/command.js');
const currencyInstance = require('../../../utils/currency.js');
const blackjackInstance = require('../../../utils/blackjack.js');

Command({
  name: 'game-blackjack',
  description: 'Blackjack',
  alias: ['blackjack', 'bj'],
  tags : {
    label : 'game'
  },
  run: async ({ m }) => {
    let minBet = 5;
    let maxBet = 500;
    let transaction = null;
    const bet = parseInt(m.content.textWithoutCommand.trim());
    if (!bet) return m.reply(__('cmd.game.blackjack.ex', { command: m.content.command }));

    if(bet == 'all') bet = maxBet;
    if (bet < minBet) return m.reply(__('cmd.game.blackjack.min', { minBet }));
    if (bet > maxBet) return m.reply(__('cmd.game.blackjack.max', { maxBet }));

    try {
      transaction = await currencyInstance.transfer({ fromJid: m.senderJid, toJid: '0@s.whatsapp.net', amount: bet, description: 'Blackjack Bet' });
    } catch (e) {
      return await m.reply(e.message);
    }

    const deck = blackjackInstance.createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    let response = `_*${m.db.user.pushName}*, you bet *${bet}* to play blackjack._\n\n`;
    response += `> *Your hand*: _${blackjackInstance.formatHand(playerHand)}_  *\`[${blackjackInstance.calculateHandValue(playerHand)}]\`*\n`;
    response += `> *Dealer's visible card*: _${blackjackInstance.formatCard(dealerHand[0])}_  *\`[${blackjackInstance.calculateHandValue(dealerHand)}+?]\`*\n\n`;
    response += 'Tipe `hit` untuk mengambil kartu lain atau `stand` untuk mempertahankan kartu Anda saat ini.';

    const sent = await m.reply(response);
    blackjackInstance.map.set(m.sender, {
      deck,
      playerHand,
      dealerHand,
      status: 'playing',
      bet: bet,
      messageKey : sent.key,
      transactionId : transaction.id
    });
  }
});