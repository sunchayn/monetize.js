/**
 * Monetize.js demo
 * Ads hiding example.
 */

if (typeof monetize === 'undefined') {
  throw new Error('Monetize.js is not imported!');
}

const ads = document.querySelectorAll('.js-ad');

/**
 * Register event listeners.
 */
monetize.when('progress').then(() => {
  ads.forEach((ad) => {
    ad.classList.add('is-hidden');
  });
});

monetize.when('stop').then(() => {
  ads.forEach((ad) => {
    ad.classList.remove('is-hidden');
  });
});

/**
 * Add a pointer to the page.
 */
monetize.setup({ addClasses: true }).pointer('$example/test');
