/**
 * Monetize.js demo
 * Working with static pointer.
 */

const state = document.getElementById('js-state');
const pointer = document.getElementById('js-pointer');
const amount = document.getElementById('js-amount');

if (typeof monetize === 'undefined') {
  throw new Error('Monetize.js is not imported!');
}

/**
 * Register event listeners.
 */

// Detected pointer
pointer.innerHTML = monetize.activePointer;

// Initialize the service with current pointer to start watching the amount.
monetize.pointer();

monetize.when('pending').then(() => {
  state.innerHTML = 'Pending...';
});

monetize.when('progress').then(() => {
  state.innerHTML = 'Sending...';

  const { activePointer } = monetize;
  if (monetize.amount.getPointerTotal(activePointer) != null) {
    amount.innerHTML = `${monetize.amount.getPointerTotal(activePointer, true)} ${monetize.amount.getPointerCurrency(activePointer)}`;
  }
});

monetize.when('stop').then(() => {
  state.innerHTML = 'Stopped...';
});
