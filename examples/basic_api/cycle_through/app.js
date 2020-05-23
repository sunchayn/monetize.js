/**
 * Monetize.js demo
 * Cycling through multiple pointers on the page.
 */

/* eslint-disable no-use-before-define,no-restricted-syntax,max-len */

const state = document.getElementById('js-state');
const pointer = document.getElementById('js-pointer');

const buttonSequential = document.getElementById('js-activate-sequential');
const buttonProbabilistic = document.getElementById('js-activate-probabilistic');

/**
 * Pointers
 */
const pointersSequential = [
  '$example.sequential/bob',
  '$example.sequential/alice',
  '$example.sequential/jhon',
];

const pointersProbabilistic = {
  '$example.probabilistic/bob': 0.75,
  '$example.probabilistic/alice': 0.2,
  '$example.probabilistic/jhon': 0.05,
};

/**
 * Update type of cycle when clicking on different buttons.
 */
buttonSequential.addEventListener('click', (e) => {
  e.preventDefault();
  resetPointersAmount();
  monetize.cycle(pointersSequential);
});

buttonProbabilistic.addEventListener('click', (e) => {
  e.preventDefault();
  resetPointersAmount();
  monetize.probabilisticCycle(pointersProbabilistic);
});

/**
 * Event listeners for monetization state changes.
 */
monetize.when('pending').then(() => {
  state.innerHTML = 'Pending...';
});

monetize.when('stop').then(() => {
  state.innerHTML = 'Stopped...';
});

monetize.when('progress').then(() => {
  state.innerHTML = 'Sending...';
  const { activePointer } = monetize;
  pointer.innerHTML = activePointer;
  pointersCache[activePointer].innerText = monetize.amount.getPointerTotal(activePointer, true) || 0;
});

/**
* Unrelated hardcoded content for the sake of example.
 */
const pointersCache = {
  '$example.sequential/bob': document.getElementById('js-pointer-1'),
  '$example.sequential/alice': document.getElementById('js-pointer-2'),
  '$example.sequential/jhon': document.getElementById('js-pointer-3'),
  '$example.probabilistic/bob': document.getElementById('js-pointer-4'),
  '$example.probabilistic/alice': document.getElementById('js-pointer-5'),
  '$example.probabilistic/jhon': document.getElementById('js-pointer-6'),
};

function resetPointersAmount() {
  for (const p in pointersCache) {
    if (pointersCache.hasOwnProperty(p)) {
      pointersCache[p].innerText = '0';
    }
  }
}
