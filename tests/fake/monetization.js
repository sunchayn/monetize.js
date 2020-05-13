const merge = require('lodash.merge');

const $events = {
  monetizationstart: {
    detail: {
      paymentPointer: '$$wallet.example.com/alice',
      requestId: 'ec4f9dec-0ba4-4029-8f6a-29dc21f2e0ce',
    },
  },

  monetizationpending: {
    detail: {
      paymentPointer: '$$wallet.example.com/alice',
      requestId: 'ec4f9dec-0ba4-4029-8f6a-29dc21f2e0ce',
    },
  },
  monetizationprogress: {
    detail: {
      paymentPointer: '$wallet.example.com/alice',
      requestId: 'ec4f9dec-0ba4-4029-8f6a-29dc21f2e0ce',
      amount: '7567',
      assetCode: 'USD',
      assetScale: 2,
    },
  },
  monetizationstop: {
    detail: {
      paymentPointer: '$$wallet.example.com/alice',
      requestId: 'ec4f9dec-0ba4-4029-8f6a-29dc21f2e0ce',
      finalized: false,
    },
  },
};

const $states = {
  monetizationpending: 'pending',
  monetizationstart: 'started',
  monetizationprogress: 'started',
  monetizationstop: 'stopped',
};

class MonetizationFake {
  constructor() {
    this.state = 'pending';
    this.events = {};
  }

  addEventListener(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);
  }

  hasEvent(event) {
    return typeof this.events[event] !== 'undefined';
  }

  fire(event, payload = {}) {
    let eventObj = $events[event] || {};
    eventObj = merge(eventObj, payload);

    this.state = $states[event] || 'pending';

    if (!payload.detail || !payload.detail.paymentPointer) {
      const tag = document.querySelector('meta[name="monetization"]');
      const pointer = (tag && tag.getAttribute('content')) || null;

      if (pointer) {
        eventObj.detail.paymentPointer = pointer;
      }
    }

    return this.events[event] && this.events[event].forEach((listener) => {
      listener(eventObj);
    });
  }

  fireAfter(event, delay, payload = {}) {
    setTimeout(() => {
      this.fire(event, payload);
    }, delay);
  }
}

module.exports = MonetizationFake;
