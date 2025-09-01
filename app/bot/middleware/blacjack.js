const blackjackInstance = require('../../utils/blackjack.js');
const currencyInstance = require('../../utils/currency.js');

module.exports = {
  handler: async (sock, m, $next) => {
    if (m.fromMe) return $next;
    try {
      const game = blackjackInstance.map.get(m.senderJid);
      if (!game || game.status !== 'playing') return $next;

      if (m.content.text === 'hit') {
        m.react('👊');
        game.playerHand.push(game.deck.pop());
        const handValue = blackjackInstance.calculateHandValue(game.playerHand);

        if (handValue > 21) {
          game.status = 'finished';
          let text = `_*${m.db.user.pushName}*, you bet *${game.bet}* to play blackjack._\n\n`;
          text += `> *Your hand*: _${blackjackInstance.formatHand(game.playerHand)}_  *\`[${handValue}]\`*\n\n`;
          text += '🎲 ~ You lose!\n\n';
          text += 'Type `!blackjack` to play again.';
          await m.reply(text);
          blackjackInstance.map.delete(m.senderJid);
        } else {
          let text = `_*${m.db.user.pushName}*, you bet *${game.bet}* to play blackjack._\`\n\n`;
          text += `> *Your hand*: _${blackjackInstance.formatHand(game.playerHand)}_  *\`[${handValue}]\`*\n`;
          text += `> *Dealer's hand*: _${blackjackInstance.formatCard(game.dealerHand[0])}_  *\`[${blackjackInstance.calculateHandValue(game.dealerHand)}+?]\`*\n\n`;
          text += '🎲 ~ `hit` or `stand`?';
          await m.reply(text);
        }
      }

      if (m.content.text === 'stand') {
        m.react('✋');
        let dealerValue = blackjackInstance.calculateHandValue(game.dealerHand);
        while (dealerValue < 17) {
          game.dealerHand.push(game.deck.pop());
          dealerValue = blackjackInstance.calculateHandValue(game.dealerHand);
        }
        const playerValue = blackjackInstance.calculateHandValue(game.playerHand);
        let winer;

        if (dealerValue > 21) {
          winer = 'You win! Dealer bust! 🎉';
          currencyInstance.transfer({ fromJid: '0@s.whatsapp.net', toJid: m.senderJid, amount: game.bet * 2, description: 'Blackjack Win' });
        } else if (dealerValue > playerValue) {
          winer = 'Dealer wins! 🤓';
        } else if (playerValue > dealerValue) {
          winer = 'You win! 🎉';
          currencyInstance.transfer({ fromJid: '0@s.whatsapp.net', toJid: m.senderJid, amount: game.bet * 2, description: 'Blackjack Win' });
        } else {
          winer = 'It\'s a tie! 🤝';
          currencyInstance.transfer({ fromJid: '0@s.whatsapp.net', toJid: m.senderJid, amount: game.bet, description: 'Blackjack Tie' });
        }

        let text = `_*${m.db.user.pushName}*, you bet *${game.bet}* to play blackjack._\n\n`;
        text += `> *Your hand*: _${blackjackInstance.formatHand(game.playerHand)}_  *\`[${playerValue}]\`*\n`;
        text += `> *Dealer's hand*: _${blackjackInstance.formatHand(game.dealerHand)}_  *\`[${dealerValue}]\`*\n\n`;
        text += `🎲 ~ ${winer}\n\n`;
        text += 'Type `!blackjack` to play again.';
        await m.reply(text);
        blackjackInstance.map.delete(m.senderJid);
      }
    } catch (error) {
      console.error(error);
    }

    return $next;
  },
};