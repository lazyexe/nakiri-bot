const { Command } = require('../../../utils/command.js');
const currencyInstance = require('../../../utils/currency.js');
const { delay } = require('baileys');
const crypto = require('crypto');

const PROB = {
  jackpot: 0.05,
  twomatch: 0.20,
  none: 0.75
};
const PAYOUT = { jackpot: 10, twomatch: 2, none: 0 };
const symbols = ['🍒', '🍋', '🍉', '🍇', '⭐', '💎', '7️⃣'];

function rng01() {
  return crypto.randomInt(0, 1_000_000_000) / 1_000_000_000;
}

function decideOutcome() {
  const r = rng01();
  const pJack = PROB.jackpot;
  const pTwo = PROB.twomatch;
  if (r < pJack) return 'jackpot';
  if (r < pJack + pTwo) return 'twomatch';
  return 'none';
}

function buildFinalSpin(outcome) {
  if (outcome === 'jackpot') {
    const s = symbols[crypto.randomInt(0, symbols.length)];
    return [s, s, s];
  }
  
  if (outcome === 'twomatch') {
    const s1 = symbols[crypto.randomInt(0, symbols.length)];
    let s2;
    do { 
      s2 = symbols[crypto.randomInt(0, symbols.length)]; 
    } while (s1 === s2);

    const positions = [0, 1, 2];
    const diffPos = positions.splice(crypto.randomInt(0, positions.length), 1)[0];

    const result = [s1, s1, s1];
    result[diffPos] = s2;
    return result;
  }

  const s1 = symbols[crypto.randomInt(0, symbols.length)];
  let s2, s3;

  do { s2 = symbols[crypto.randomInt(0, symbols.length)]; } while (s1 === s2);
  do { s3 = symbols[crypto.randomInt(0, symbols.length)]; } while (s3 === s1 || s3 === s2);

  const arr = [s1, s2, s3];
  arr.sort(() => crypto.randomInt(-10, 10));
  return arr;
}

function randomSpin() {
  const arr = symbols.slice();
  arr.sort(() => crypto.randomInt(-10, 10));
  return arr.slice(0, 3);
}

Command({
  name: 'game-slot',
  description: 'Main slot dengan probabilitas terkontrol',
  alias: ['slot', 'jackpot'],
  run: async ({ sock, m }) => {
    const baseBet = 50;
    const maxBet = 250;
    const bet = parseInt(m.content.textWithoutCommand.trim());

    if (isNaN(bet) || bet < baseBet || bet % baseBet !== 0) {
      await m.sendMessage(m.chat, {
        text: `Masukkan jumlah taruhan kelipatan ${baseBet}.\nContoh: ${m.content.command} 150`
      }, { quoted: m });
      return;
    }

    if (bet > maxBet) {
      await m.sendMessage(m.chat, {
        text: `Maksimum taruhan adalah ${maxBet}.`
      }, { quoted: m });
      return;
    }

    try {
      await currencyInstance.transfer({ fromJid: m.senderJid, toJid: '0@s.whatsapp.net', amount: bet });
    } catch (e) {
      return await m.reply(e.message);
    }

    const numSpins = bet / baseBet;
    let totalWin = 0;
    let allResults = [];

    let msg = await sock.sendMessage(m.chat, {
      text: `✅ Memulai ${numSpins} putaran...\n\nSpin 1/${numSpins} | ${randomSpin().join(' ')} |`
    }, { quoted: m });

    for (let i = 0; i < numSpins; i++) {
      for (let j = 0; j < 6; j++) {
        await delay(450);
        await sock.sendMessage(m.chat, {
          text: `✅ Memulai ${numSpins} putaran...\n\nSpin ${i + 1}/${numSpins} | ${randomSpin().join(' ')} |` ,
          edit: msg.key
        });
      }
      await delay(650);

      const outcome = decideOutcome();
      const finalSpin = buildFinalSpin(outcome);
      const winAmount = Math.floor(baseBet * PAYOUT[outcome]);
      totalWin += winAmount;

      let label = '';
      if (outcome === 'jackpot') {
        label = '🎉 JACKPOT!';
      } else if (outcome === 'twomatch') {
        label = '✨ Lumayan!';
      } else {
        label = '😢 Kalah.';
      }

      allResults.push({
        spin: i + 1,
        result: finalSpin,
        win: winAmount,
        outcomeLabel: label
      });

      await delay(1000);

      await sock.sendMessage(m.chat, {
        text: `✅ Memulai ${numSpins} putaran...\n\nSpin ${i + 1}/${numSpins} | ${finalSpin.join(' ')} |\n${label}` ,
        edit: msg.key
      });
    }

    await delay(1500);

    let summaryText = `*Hasil Akhir (${numSpins} Putaran)*\n`;
    allResults.forEach(res => {
      summaryText += `\n🎰 Spin ${res.spin}: ${res.result.join(' ')}\n> ${res.outcomeLabel} Menang ${res.win}!\n`;
    });

    summaryText += `\n*Total Taruhan:* ${bet}\n*Total Kemenangan:* ${totalWin}\n*${totalWin > bet ? 'Keuntungan' : 'Kerugian'}:* ${totalWin - bet}`;

    if (totalWin !== 0) {
      try {
        await currencyInstance.transfer({ fromJid: '0@s.whatsapp.net', toJid: m.senderJid, amount: totalWin });
      } catch (e) {
        return await m.reply(e.message);
      }
    }

    await sock.sendMessage(m.chat, { text: summaryText, edit: msg.key });
  }
});