const Promise = require('promise-polyfill');

/**
 * Map user friendly event to the Specifications events.
 * @type {{stop: string, pending: string, progress: string}}
 */
const eventMapping = {
  pending: 'monetizationpending',
  progress: 'monetizationprogress',
  stop: 'monetizationstop',
};

/**
 * Watch the monetization events and expose Promises for callbacks.
 */
class Watcher {
  /**
   * Initialize the class.
   */
  constructor() {
    // Initial event that triggered the watcher.
    this.event = null;
  }

  /**
   * Setup the context that called the watcher.
   * @param {EventTarget} event
   * @param {Amount} amount amount utility to use.
   * @returns {Watcher}
   */
  initializedWith(event, amount) {
    this.event = event;
    this.watchAmount(amount);
    return this;
  }

  /**
   * Register the event listener for amount updates.
   * @param {Amount} amount amount utility to use.
   */
  // eslint-disable-next-line class-methods-use-this
  watchAmount(amount) {
    document.monetization.addEventListener('monetizationprogress', (evt) => {
      amount.updatePointerPaymentData(evt.detail);
    });
  }

  /**
   * Listen to the given event and serve the callback via a Promise.
   * @param {string} event
   * @returns {Promise}
   */
  // eslint-disable-next-line class-methods-use-this
  when(event) {
    return new Promise((resolve, reject) => {
      if (!eventMapping[event]) {
        reject(new Error(`Event '${event}' is not supported.`));
      }

      document.monetization.addEventListener(eventMapping[event], (evt) => {
        resolve(evt.detail);
      });
    });
  }
}

module.exports = Watcher;
