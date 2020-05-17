import Watcher from './Watcher';
import Amount from './Amount';
import PromiseLoop from '../helpers/PromiseLoop';

const merge = require('lodash.merge');
const sample = require('lodash.sample');

/**
 * Create a new instance of Monetize.js
 */
class Monetize {
  /**
   * Initialize the class.
   */
  constructor() {
    this.default = {
      addClasses: false,
      classes: {
        disabled: 'js-monetization-disabled',
        enabled: 'js-monetization-enabled',
        pending: 'js-monetization-pending',
        stopped: 'js-monetization-stopped',
        sending: 'js-monetization-sending',
      },
    };

    // Monetization meta tag holder.
    this.tag = null;

    this.activePointer = null;

    this.init();
    this.observeHead();
  }

  /**
   * Setup default values and verify support for Monetization API.
   */
  init() {
    this.watcher = new Watcher();
    this.amount = new Amount();

    this.config = merge(this.default, this.config);

    if (!document.monetization) {
      this.enabled = false;
      return;
    }

    this.enabled = true;
  }

  observeHead() {
    (new MutationObserver(() => {
      // todo: add test for this observer
      const pointer = this.detectPointerFromMetaTag();
      this.activePointer = pointer || null;
    })).observe(document.head, { childList: true });
  }

  /**
   * Update the configuration object.
   * @param {object} options
   * @returns {Monetize}
   */
  configure(options) {
    this.config = merge(this.default, options);

    if (this.config.addClasses) {
      this._addServiceStatusClass();
    }

    return this;
  }

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
        this.registerCssClasses();
      }

      if (pointer) {
        this.setupMetaTag(pointer);
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
   * Randomly cycle through the given pointer.
   * @param {string[]} pointers list of pointers to pick from.
   * @param {number} timeout how often the pointer should be changed.
   * @param {function} callback an optional callback to control how a pointer is chosen.
   * It must return a pointer otherwise it will be ignored.
   * @returns {PromiseLoop}
   */
  pointers(pointers, timeout = 3000, callback) {
    this._timer = setInterval(() => {
      let pointer;

      if (typeof callback === 'function') {
        pointer = callback(pointers);
      }

      if (!pointer) {
        pointer = sample(pointers);
      }

      this.update(pointer);
    }, timeout);

    return this.pointer(sample(pointers));
  }

  /**
   * Randomly select a pointer from the list.
   * @param {string[] | Object.<string, number>} pointers
   */
  pointerPerTime(pointers) {
    if (Array.isArray(pointers)) {
      return this.pointer(sample(pointers));
    }

    return this.pointer(this.pickByProbability(pointers));
  }

  // eslint-disable-next-line class-methods-use-this
  pickByProbability(pointers) {
    const sum = Object.values(pointers).reduce((acc, weight) => acc + weight, 0);
    let choice = Math.random() * sum;

    // eslint-disable-next-line no-restricted-syntax
    for (const pointer in pointers) {
      // eslint-disable-next-line no-prototype-builtins
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
   * Change the currently active pointer.
   * @param {string} pointer a new pointer to use.
   * @returns {Monetize}
   */
  update(pointer) {
    this.setupMetaTag(pointer);
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
   */
  setupMetaTag(pointer) {
    this.activePointer = pointer;

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
   */
  registerCssClasses() {
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
