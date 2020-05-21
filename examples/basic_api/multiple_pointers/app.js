/**
 * Monetize.js demo
 * Adding multiple pointers to the page.
 */

/* eslint-disable no-use-before-define,no-restricted-syntax,max-len,no-alert */
const pointerHost = document.getElementById('js-pointer');

const buttonRandom = document.getElementById('js-activate-random');
const buttonProbabilistic = document.getElementById('js-activate-probabilistic');

/**
 * Pointers
 */
const pointers = [
  '$example/alice',
  '$example/bob',
  '$example/jhon',
];

const pointersProbabilistic = {
  '$example.probabilistic/alice': 0.55,
  '$example.probabilistic/bob': 0.05,
  '$example.probabilistic/jhon': 0.40,
};

/**
 * Update type of cycle when clicking on different buttons.
 */
buttonRandom.addEventListener('click', (e) => {
  e.preventDefault();

  monetize.pluck(pointers).catch((error) => {
    alert(error.message);
  });

  animateHost();
});

buttonProbabilistic.addEventListener('click', (e) => {
  e.preventDefault();

  monetize.pluck(pointersProbabilistic).catch((error) => {
    alert(error.message);
  });

  animateHost();
});

monetize.when('pointer_changed').then((pointer) => {
  pointerHost.innerText = pointer;
});

/**
 * Helpers
 */

/**
 * Add animation to pointer to avoid confusing when it pick the same pointer twice in a row.
 */
function animateHost() {
  pointerHost.classList.add('opacity-50');
  setTimeout(() => {
    pointerHost.classList.remove('opacity-50');
  }, 300);
}
