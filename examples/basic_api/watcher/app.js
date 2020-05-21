/**
 * Monetize.js demo
 * Basic event watching
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
monetize.when('pending').then(() => {
  state.innerHTML = 'Pending...';
});

monetize.when('stop').then(() => {
  state.innerHTML = 'Stopped...';
});

/**
 * Add a pointer to the page.
 */
monetize.pointer('$wallet.example.com/mazen').then((watcher) => {
  watcher.when('progress').then((event) => {
    state.innerHTML = 'Sending...';
    const { paymentPointer } = event;
    pointer.innerHTML = paymentPointer;
    amount.innerHTML = `${monetize.amount.getPointerTotal(paymentPointer, true)} ${monetize.amount.getPointerCurrency(paymentPointer)}`;
  });
});
