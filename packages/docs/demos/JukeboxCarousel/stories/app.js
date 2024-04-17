import { Base, createApp } from '@studiometa/js-toolkit';

class Logos extends Base {
  previousIndex = 0;

  /**
   * Class config.
   * @type {import('@studiometa/js-toolkit').BaseConfig}
   */
  static config = {
    name: 'Logos',
    refs: ['container'],
  };

  /**
   * Start Interval
   * @param  {number} delay delay for starting animation
   * @returns {void}
   */
  startAnimation(delay) {
    // For demo
    setTimeout(() => {
      setInterval(() => {
        this.changeLogos(0, this.$parent.__options.total);
      }, 4000);
    }, delay);
  }

  /**
   * Do translation
   * @param  {number} min min value.
   * @param  {number} max max value.
   * @returns {void}
   */
  changeLogos(min, max) {
    const randomIndex = [];
    for (let i = min; i <= max; i += 1) {
      if (!this.$parent.excludedIndexs.includes(i)) {
        randomIndex.push(i);
      }
    }

    // Sélection d'un nombre aléatoire parmi les nombres possibles
    const index = Math.floor(Math.random() * randomIndex.length);
    this.$parent.excludedIndexs.push(randomIndex[index]);

    if (randomIndex[index] !== undefined) {
      this.$refs.container.style.transform = `translateY(-${randomIndex[index] * 100}%)`;
    } else {
      this.$parent.excludedIndexs = [];
    }
  }
}

class RandomLogo extends Base {
  excludedIndexs = [0, 1, 2, 3, 4];

  launchTimer = [0, 500, 750, 1000, 1250];

  /**
   * Class config.
   * @type {import('@studiometa/js-toolkit').BaseConfig}
   */
  static config = {
    name: 'RandomLogo',
    components: {
      Logos,
    },
    options: {
      total : {
        type: Number,
        default: 0
      }
    }
  };

  /**
   * Mount component
   * @returns {void}
   */
  mounted() {
    this.$children.Logos.forEach((element, index) => {
      element.startAnimation(this.launchTimer[index]);
    });
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      RandomLogo,
    }
  };
}

createApp(App)