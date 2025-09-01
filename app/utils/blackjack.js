class BlackJack {
  constructor() {
    this.map = new Map();
    this.suits = ['♠', '♣', '♥', '♦'];
    this.cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  }

  createDeck() {
    const deck = [];
    for (const suit of this.suits) {
      for (const value of this.cards) {
        deck.push({ suit, value });
      }
    }
    return this.shuffle(deck);
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getCardValue(card) {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
  }

  calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.value === 'A') {
        aces++;
      } else {
        value += this.getCardValue(card);
      }
    }

    for (let i = 0; i < aces; i++) {
      if (value + 11 <= 21) {
        value += 11;
      } else {
        value += 1;
      }
    }

    return value;
  }

  formatCard(card) {
    return `${card.value}${card.suit}`;
  }

  formatHand(hand) {
    return hand.map(this.formatCard).join(' ');
  }
}

const BlackjackInstance = new BlackJack();
module.exports = BlackjackInstance;