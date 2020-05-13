const monetize = require('../../src/index.js');
const MonetizationFake = require('../fake/monetization');
const Monetize = require('../../src/core/Monetize');

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

describe('Configuration', () => {
  test('it update API configuration', () => {
    const config = {
      addEnabledClass: true,
    };

    const configured = monetize.configure(config);

    expect(configured).toBeInstanceOf(Monetize);
    expect(monetize.config).toEqual(expect.objectContaining(config));
  });

  test('it add css classes to body when enabled', () => {
    const config = {
      addEnabledClass: true,
      classes: {
        enabled: 'js-enabled-override',
      },
    };

    document.monetization.fireAfter('monetizationstart', 200);

    return monetize.configure(config)
      .pointer('$wallet')
      .then(() => {
        expect(document.body.classList.contains(monetize.config.classes.enabled)).toBeTruthy();
        expect(document.body.classList.contains(monetize.config.classes.pending)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.stopped)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.sending)).toBeTruthy();

        document.monetization.fire('monetizationpending');
        expect(document.body.classList.contains(monetize.config.classes.pending)).toBeTruthy();
        expect(document.body.classList.contains(monetize.config.classes.stopped)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.sending)).toBeFalsy();

        document.monetization.fire('monetizationstop');
        expect(document.body.classList.contains(monetize.config.classes.pending)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.stopped)).toBeTruthy();
        expect(document.body.classList.contains(monetize.config.classes.sending)).toBeFalsy();
      });
  });

  test('it does not add css classes to body when disabled', () => {
    document.body.className = "";
    const config = {
      addEnabledClass: false,
    };

    document.monetization.fireAfter('monetizationstart', 200);

    return monetize.configure(config)
      .pointer('$wallet')
      .then(() => {
        document.monetization.fire('monetizationpending');
        document.monetization.fire('monetizationstop');
        expect(document.body.classList.contains(monetize.config.classes.enabled)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.pending)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.stopped)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.sending)).toBeFalsy();
      });
  });
});
