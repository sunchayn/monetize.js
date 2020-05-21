/**
 * Monetize.js demo
 * Using it with VueJs
 */

if (typeof monetize === 'undefined') {
  throw new Error('Monetize.js is not imported!');
}

/**
 * Setup vue
 */
const data = {
  status: 'n/a',
  monetized: false,
};

const vm = new Vue({
  el: '#app',
  data,
  mounted() {
    this.$el.classList.remove('hidden');
  },
});

monetize.when('pending').then(() => {
  data.status = 'Pending...';
  data.monetized = false;
});

monetize.when('stop').then(() => {
  data.status = 'Stopped...';
  data.monetized = false;
});

monetize.when('progress').then(() => {
  data.status = 'Sending...';
  data.monetized = true;
});

/**
 * Add a pointer to the page.
 */
monetize.pointer('$example/test');
