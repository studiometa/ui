import { Base, createApp } from '@studiometa/js-toolkit';

class Cards extends Base {
  /**
   * Class config.
   * @type {import('@studiometa/js-toolkit').BaseConfig}
   */
  static config = {
    name: 'Cards',
    refs: ['card[]'],
  };

  /**
   * Mount component
   * @returns {void}
   */
  mounted() {
    [this.activeCard] = this.$refs.card;
    setInterval(() => {
      this.changeCards();
    }, 3000);
  }

  /**
   * Animate cards
   * @returns {void}
   */
  changeCards() {
    const leavingCard = document.querySelector('.card--leaving');
    if (leavingCard) {
      leavingCard.classList.remove('card--leaving', 'translate-x-full');
    }

    this.activeCard.classList.add('card--leaving');
    this.activeCard.classList.remove('card--active');

    const newActiveCard = this.activeCard.nextElementSibling
      ? this.activeCard.nextElementSibling
      : this.$refs.card[0];

    if (newActiveCard) {
      newActiveCard.classList.add('card--active');
      newActiveCard.classList.remove('card--next');
    }

    const nextCard = newActiveCard.nextElementSibling
      ? newActiveCard.nextElementSibling
      : this.$refs.card[0];
    if (nextCard) {
      nextCard.classList.remove('card--futur');
      nextCard.classList.add('card--next');
    }

    const futureCard = nextCard.nextElementSibling
      ? nextCard.nextElementSibling
      : this.$refs.card[0];
    if (futureCard) {
      futureCard.classList.add('card--futur');
    }

    this.activeCard = newActiveCard;
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Cards,
    }
  };
}

createApp(App)
