// const Promise = require('promise-polyfill')._default;
import PromiseLoop from '../helpers/PromiseLoop';
/**
 * Map user friendly event to the Specifications events.
 * @type {{stop: string, pending: string, progress: string}}
 */
const eventMapping = {
  pending: 'monetizationpending',
  progress: 'monetizationprogress',
  stop: 'monetizationstop',
  start: 'monetizationstart',
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

    /**
     * List of allowed custom events.
     * @type {string[]}
     */
    this.customEvents = [
      'pointer_changed',
    ];

    /**
     * Custom event listeners.
     * @type {*[]}
     */
    this.listeners = [];
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
  watchAmount(amount) {
    document.monetization.addEventListener('monetizationprogress', (evt) => {
      amount.updatePointerPaymentData(evt.detail);
    });
  }

  /**
   * Dispatch a custom event.
   * @param {string} event
   * @param {*} data Data to pass to Event listener
   * @returns {*}
   */
  dispatchCustomEvent(event, data) {
    return this.listeners[event] && this.listeners[event].forEach((listener) => {
      listener(data);
    });
  }

  /**
   * Listen to the given event and serve the callback via a Promise.
   * @param {string} event
   * @returns {PromiseLoop}
   */
  when(event) {
    return new PromiseLoop((resolve, reject) => {
      if (!this._resolveCustomEvent(event, resolve)) {
        if (!eventMapping[event]) {
          reject(new Error(`Event '${event}' is not supported.`));
          return true;
        }

        document.monetization.addEventListener(eventMapping[event], (evt) => {
          resolve(evt.detail);
        });
      }
    });
  }

  /**
   * Add event listener for custom events that are not part of Monetization API
   * @param {string} event Custom event to add
   * @param {function} callback Event listener
   * @returns {boolean} indicates whether the event listener has been attached
   * @private
   */
  _resolveCustomEvent(event, callback) {
    if (this.customEvents.includes(event)) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }

      this.listeners[event].push((data) => {
        callback(data);
      });

      return true;
    }
  }
}

export default Watcher;
