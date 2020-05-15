const $states = {
  monetizationpending: 'pending',
  monetizationstart: 'started',
  monetizationprogress: 'started',
  monetizationstop: 'stopped',
};

export default class FakeMonetizationAPI {
  constructor() {
    this.state = null;
    this.events = {};
  }

  addEventListener(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);
  }

  dispatchEvent(event) {
    this.state = $states[event.type] || 'n/a';
    if (event.detail && !event.detail.paymentPointer) {
      const pointer = this.detectPointerFromMetaTag();
      if (pointer) {
        // eslint-disable-next-line no-param-reassign
        event.detail.paymentPointer = pointer;
      }
    }

    return this.events[event.type] && this.events[event.type].forEach((listener) => {
      listener(event);
    });
  }

  /**
   * Detect if there's a pointer in the page.
   * @returns {string | null}
   */
  detectPointerFromMetaTag() {
    const currentTag = document.querySelector('meta[name="monetization"]');
    return (currentTag && currentTag.getAttribute('content')) || null;
  }
}
