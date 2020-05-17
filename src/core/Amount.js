const merge = require('lodash.merge');

/**
 * Received amount(s) utility
 */
class Amount {
  /**
   * Initialize the class.
   */
  constructor() {
    /**
     * Hold the captures cycle.
     * @type object
     */
    this.pointers = {};
  }

  /**
   * Update a pointer with new received data.
   * @param {EventTarget} event
   */
  updatePointerPaymentData(event) {
    let current = this.pointers[event.paymentPointer];

    if (current) {
      this.pointers[event.paymentPointer].amount += Number(event.amount);
    } else {
      this.pointers[event.paymentPointer] = {
        amount: Number(event.amount),
      };

      current = this.pointers[event.paymentPointer];
    }

    this.pointers[event.paymentPointer] = merge(current, {
      unit: event.assetCode,
      scale: event.assetScale,
    });
  }

  /**
   * Get the total amount received grouped by currencies.
   * @param formatted
   * @returns {object|float} return total amount for each currency or the total amount if there's
   * only one currency.
   */
  total(formatted = false) {
    const total = {};

    const pointers = Object.keys(this.pointers);
    pointers.forEach((pointer) => {
      const { amount, scale, unit } = this.pointers[pointer];

      if (!total[unit]) {
        total[unit] = 0;
      }

      total[unit] += formatted ? Number(this.formatAmount(amount, scale)) : amount;
    });

    return Object.keys(total).length === 1 ? total[Object.keys(total)[0]] : total;
  }

  /**
   * Get the total amount for a given pointer
   * @param {string} pointer payment pointer.
   * @param {boolean} formatted indicate if it should format the amount.
   * @returns {null|number} Return the accumulated amount or null if the pointer is not found.
   */
  getPointerTotal(pointer, formatted = false) {
    const data = this.pointers[pointer] ? this.pointers[pointer] : null;

    if (!data) {
      return null;
    }

    if (formatted) {
      return this.formatAmount(data.amount, data.scale);
    }

    return data.amount;
  }

  /**
   * Transform the amount to human friendly representation using the currency scale.
   * @param {number} amount
   * @param {number} scale
   * @returns {string}
   */
  // eslint-disable-next-line class-methods-use-this
  formatAmount(amount, scale) {
    return (amount * (10 ** -scale)).toFixed(scale);
  }

  /**
   * Get the captured currency for a given pointer.
   * @param {string} pointer payment pointer.
   * @returns {string|null} the currency or null if pointer not found.
   */
  getPointerCurrency(pointer) {
    return this.pointers[pointer] ? this.pointers[pointer].unit : null;
  }
}

export default Amount;
