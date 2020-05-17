import Watcher from './Watcher';
import Amount from './Amount';
import PromiseLoop from '../helpers/PromiseLoop';

const merge = require('lodash.merge');

/**
 * Create a new instance of Monetize.js
 */
class Monetize {
  /**
   * Initialize the class.
   */
  constructor() {
    /**
     * Default settings.
     *
     * @type {{
     *  classes: {
     *    stopped: string, pending: string, sending: string, disabled: string, enabled: string
     *  },
     *  addClasses: boolean
     * }}
     */
    this._default = {
      addClasses: false,
      classes: {
        disabled: 'js-monetization-disabled',
        enabled: 'js-monetization-enabled',
        pending: 'js-monetization-pending',
        stopped: 'js-monetization-stopped',
        sending: 'js-monetization-sending',
      },
    };

    /**
     * Main configuration.
     */
    this.config = this._default;

    // Monetization meta tag holder.
    this.tag = null;

    this.activePointer = null;

    this.init();
    this._observeHead();
  }

  /**
   * Setup _default values and verify support for Monetization API.
   */
  init() {
    this.watcher = new Watcher();
    this.amount = new Amount();

    this.config = merge(this._default, this.config);

    if (!document.monetization) {
      this.enabled = false;
      return;
    }

    this.enabled = true;
  }

  /**
   * Watch head tag for changes to update thr active pointer.
   * @private
   */
  _observeHead() {
    (new MutationObserver(() => {
      const pointer = this.detectPointerFromMetaTag();
      this.activePointer = pointer || null;
    })).observe(document.head, { childList: true });
  }

  /**
   * Update the configuration object.
   * @param {object} options
   * @returns {Monetize}
   */
  setup(options) {
    this.config = merge(this._default, options);

    if (this.config.addClasses) {
      this._addServiceStatusClass();
    }

    return this;
  }

  /**
   * if the Monetization API is enable it will  Add a new wallet pointer to the page
   * then register the required events for the monetization.
   * @param {null|string} pointer
   * @returns {PromiseLoop}
   */
  pointer(pointer = null) {
    return new PromiseLoop((resolve, reject) => {
      if (!this.isEnabled()) {
        reject(new Error('Web monetization is not enabled in this browser.'));
        return true;
      }

      if (this.config.addClasses) {
        this._registerCssClasses();
      }

      if (pointer) {
        this._setupMetaTag(pointer);
      } else if (!this.detectPointerFromMetaTag()) {
        reject(new Error('You have to provide a wallet.'));
        return true;
      }

      document.monetization.addEventListener('monetizationstart', (event) => {
        resolve(this.watcher.initializedWith(event, this.amount));
      });

      return true;
    });
  }

  /**
   * Sequentially cycle through the given pointers.
   * @param {string[]} pointers list to pick from.
   * @param {number} timeout how often the pointer should be changed.
   * @param {function} callback an optional callback to control how a pointer is chosen.
   * It must return a pointer otherwise it will be ignored.
   * @returns {PromiseLoop}
   */
  cycle(pointers, timeout = 3000, callback) {
    // Remove old intervals.
    clearInterval(this._timer);

    let lastIndex = 0;

    this._timer = setInterval(() => {
      let pointer;

      if (typeof callback === 'function') {
        pointer = callback(pointers);
      }

      if (!pointer) {
        pointer = pointers[lastIndex];
        lastIndex = lastIndex <= pointers.length - 1 ? lastIndex + 1 : 0;
      }

      this.set(pointer);
    }, timeout);

    return this.pointer(pointers[0]);
  }

  /**
   * Randomly select a pointer from the list.
   * @param {Object.<string, number>} pointers
   * @param {number} timeout how often the pointer should be changed.
   * @returns {PromiseLoop}
   */
  probabilisticCycle(pointers, timeout = 3000) {
    // Remove old intervals.
    clearInterval(this._timer);

    this._timer = setInterval(() => {
      this.set(this._getLuckyPointer(pointers));
    }, timeout);

    return this.pointer(this._getLuckyPointer(pointers));
  }

  /**
   * Randomly select a pointer from the list.
   * @param {string[] | Object.<string, number>} pointers
   * @returns {PromiseLoop}
   */
  pluck(pointers) {
    if (Array.isArray(pointers)) {
      const index = this._randomNumber(0, pointers.length - 1);
      return this.pointer(pointers[index]);
    }

    return this.pointer(this._getLuckyPointer(pointers));
  }

  // eslint-disable-next-line class-methods-use-this
  _getLuckyPointer(pointers) {
    const sum = Object.values(pointers).reduce((acc, weight) => acc + weight, 0);
    let choice = Math.random() * sum;

    // eslint-disable-next-line no-restricted-syntax
    for (const pointer in pointers) {
      if (pointers.hasOwnProperty(pointer)) {
        const weight = pointers[pointer];
        choice -= weight;
        if (choice <= 0) {
          return pointer;
        }
      }
    }

    return null;
  }

  /**
   * Update the meta tag with the given pointer.
   * @param {string} pointer a new pointer to use.
   * @returns {Monetize}
   */
  set(pointer) {
    this._setupMetaTag(pointer);
    return this;
  }

  /**
   * Detect if there's a pointer in the page.
   * @returns {string | null}
   */
  detectPointerFromMetaTag() {
    const currentTag = document.querySelector('meta[name="monetization"]');
    return (currentTag && currentTag.getAttribute('content')) || null;
  }

  /**
   * Create a meta tag with the provided pointer.
   * @param {string} pointer A pointer to add.
   * @private
   */
  _setupMetaTag(pointer) {
    const currentTag = document.querySelector('meta[name="monetization"]');

    if (currentTag) {
      currentTag.remove();
    }

    const tag = document.createElement('meta');
    tag.name = 'monetization';
    tag.content = pointer;

    document.head.appendChild(tag);
    this.tag = tag;
  }

  /**
   * Add a CSS class for Monetization State to Body tag.
   * @private
   */
  _registerCssClasses() {
    const showProgressClasses = () => {
      document.body.classList.remove(this.config.classes.stopped);
      document.body.classList.remove(this.config.classes.pending);
      document.body.classList.add(this.config.classes.sending);
    };

    document.monetization.addEventListener('monetizationpending', () => {
      document.body.classList.remove(this.config.classes.stopped);
      document.body.classList.remove(this.config.classes.sending);
      document.body.classList.add(this.config.classes.pending);
    });

    document.monetization.addEventListener('monetizationstart', showProgressClasses);

    document.monetization.addEventListener('monetizationprogress', showProgressClasses);

    document.monetization.addEventListener('monetizationstop', () => {
      document.body.classList.remove(this.config.classes.pending);
      document.body.classList.remove(this.config.classes.sending);
      document.body.classList.add(this.config.classes.stopped);
    });
  }

  /**
   * Add a class that indicate whether the Web monetization API is supported.
   * @private
   */
  _addServiceStatusClass() {
    if (this.isEnabled()) {
      document.body.classList.remove(this.config.classes.disabled);
      document.body.classList.add(this.config.classes.enabled);
    } else {
      document.body.classList.remove(this.config.classes.enabled);
      document.body.classList.add(this.config.classes.disabled);
    }
  }

  /**
   * Get a random number withing range.
   * @param min
   * @param max
   * @returns {number}
   * @private
   */
  _randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /**
   * Destroy the watchers and previous states.
   * @returns {Monetize}
   */
  refresh() {
    this.init();
    clearInterval(this._timer);
    return this;
  }

  /**
   * Proxy for watcher.
   * @returns {PromiseLoop}
   */
  when(...args) {
    return this.watcher.when.apply(null, args);
  }

  /**
   * Check if the Monetization API is supported by the current browser.
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Check if there's a monetization stream going on.
   * @returns {boolean}
   */
  isSending() {
    return this.isEnabled() && document.monetization.state === 'started';
  }

  /**
   * Check if the service is idle.
   * @returns {boolean}
   */
  isStopped() {
    return this.isEnabled() && document.monetization.state === 'stopped';
  }

  /**
   * Check if the service is waiting for the first payment.
   * @returns {boolean}
   */
  isPending() {
    return this.isEnabled() && document.monetization.state === 'pending';
  }
}

export default Monetize;
