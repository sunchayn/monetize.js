/**
 * Monetize.js demo
 * Loading exclusive content example.
 */

/* eslint-disable no-use-before-define */

if (typeof monetize === 'undefined') {
  throw new Error('Monetize.js is not imported!');
}

const notice = document.getElementById('js-notice');
const host = document.getElementById('js-host');
const loader = document.getElementById('js-loader');

let timer = null;
let loaded = false;

/**
 * Register event listeners.
 */
monetize.when('progress').then(() => {
  clearTimeout(timer);

  if (!loaded) {
    loaded = true;
    loadBonusContent();
  }
});

monetize.when('stop').then(() => {
  // After 2s of inactive monetization hide the bonus content
  timer = setTimeout(() => {
    if (!monetize.isSending()) {
      hideBonusContent();
    }
  }, 2000);
});

/**
 * Add a pointer to the page.
 */
monetize.setup({ addClasses: true }).pointer('$example/test');

/**
 * Helppers
 */

function loadBonusContent() {
  notice.classList.add('hidden');
  loader.classList.remove('hidden');

  axios.get('https://aws.random.cat/meow')
    .then((response) => {
      host.innerHTML = `<img src="${response.data.file}" alt="Random cat image" width="400" />`;
      loader.classList.add('hidden');
      host.classList.remove('hidden');
    })
    .catch((error) => {
      console.log(error);
      alert('Unable to load bonus content.');
    });
}

function hideBonusContent() {
  loaded = false;
  notice.classList.remove('hidden');
  loader.classList.add('hidden');
  host.classList.add('hidden');
}
