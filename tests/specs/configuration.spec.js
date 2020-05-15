import Monetize from '../../src/core/Monetize';

import monetize from '../../src/monetize';

const MonetizationFake = require('../fake/monetization');

// Helper delay execution
const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

describe('Configuration', () => {
  test('it update API configuration', () => {
    const config = {
      addClasses: true,
    };

    const configured = monetize.configure(config);

    expect(configured).toBeInstanceOf(Monetize);
    expect(monetize.config).toEqual(expect.objectContaining(config));
  });

  test('it add css classes to body when enabled', () => {
    const config = {
      addClasses: true,
      classes: {
        enabled: 'js-enabled-override',
      },
    };

    monetize.configure(config).refresh();

    document.monetization.fireAfter('monetizationstart', 5);

    monetize
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

    return wait(10).then(() => {
      expect.assertions(10);
    });
  });

  test('it add css class to body when disabled', () => {
    const config = {
      addClasses: true,
    };

    document.monetization = null;

    monetize.configure(config).refresh();
    expect(document.body.classList.contains(monetize.config.classes.disabled)).toBeTruthy();
  });

  test('it does not add css classes to body when disabled', () => {
    document.body.className = '';
    const config = {
      addClasses: false,
    };

    document.monetization.fireAfter('monetizationstart', 5);

    monetize.configure(config)
      .pointer('$wallet')
      .then(() => {
        document.monetization.fire('monetizationpending');
        document.monetization.fire('monetizationstop');
        expect(document.body.classList.contains(monetize.config.classes.disabled)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.enabled)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.pending)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.stopped)).toBeFalsy();
        expect(document.body.classList.contains(monetize.config.classes.sending)).toBeFalsy();
      });

    return wait(10).then(() => {
      expect.assertions(5);
    });
  });
});
