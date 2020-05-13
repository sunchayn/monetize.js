const Promise = require('promise-polyfill');
const monetize = require('../../src/index.js');
const MonetizationFake = require('../fake/monetization');

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

describe('Core API', () => {
  test('it detect Web Monetization API status.', () => {
    expect(monetize.isEnabled()).toBeTruthy();

    document.monetization = null;
    expect(monetize.refresh().isEnabled()).toBeFalsy();
  });

  test('it properly add the event listeners.', () => {
    monetize.pointer('$wallet');
    expect(document.monetization.hasEvent('monetizationstart')).toBeTruthy();
  });

  test('it resolve the promise when event is fired.', () => {
    expect.assertions(2);
    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer('$wallet').then((watcher) => {
      expect(watcher).toBeDefined();
      expect(watcher.event).toBeTruthy();
    });
  });

  test('it throw error when setup with disabled monetization.', () => {
    document.monetization = null;
    monetize.refresh();

    expect.assertions(1);
    return monetize.pointer('$wallet 2').catch((e) => expect(e.message).toMatch('Web monetization is not enabled in this browser.'));
  });

  test('it throw error when setup while wallet is not passed.', () => {
    expect.assertions(1);
    return monetize.pointer().catch((e) => expect(e.message).toMatch('You have to provide a wallet.'));
  });

  test('it add proper meta tag', () => {
    const pointer = '$wallet';

    // Setup monetization
    monetize.pointer(pointer);

    const tag = document.querySelector('meta[name="monetization"]');
    expect(tag).toBeInstanceOf(HTMLMetaElement);
    expect(tag.getAttribute('content')).toEqual(pointer);
  });

  test('it randomly cycle through multiple pointers', () => {
    expect.assertions(1);
    document.monetization.fireAfter('monetizationstart', 100);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    return monetize.pointers(pointers, 1).then(() => {
      const checked = [];

      const timer = setInterval(() => {
        if (!checked.includes(monetize.activePointer)) {
          checked.push(monetize.activePointer);
        }

        if (checked.length === pointers.length) {
          clearInterval(timer);
        }
      }, 1);

      return (new Promise((res) => setTimeout(() => {
        res();
      }, 50))).then(() => expect(checked.length).toEqual(pointers.length));
    });
  });

  test('it can use custom callback cycle through multiple pointers', () => {
    expect.assertions(1);
    document.monetization.fireAfter('monetizationstart', 100);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    const indexToUse = 2;

    return monetize.pointers(pointers, 1, (elements) => elements[indexToUse])
      .then(() => {
        let onlyOneItemIsReturned = true;

        const timer = setInterval(() => {
          if (monetize.activePointer !== pointers[indexToUse]) {
            onlyOneItemIsReturned = false;
            clearInterval(timer);
          }
        }, 1);

        return (new Promise((res) => setTimeout(() => {
          res();
        }, 50))).then(() => expect(onlyOneItemIsReturned).toBeTruthy());
      });
  });

  test('it can randomly pick a pointer from list', () => {
    document.monetization.fireAfter('monetizationstart', 100);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    return monetize.pointerPerTime(pointers).then(() => {
      expect(pointers).toContain(monetize.activePointer);
    });
  });

  test('it can randomly pick a pointer from list by its probability', () => {
    document.monetization.fireAfter('monetizationstart', 100);

    const pointers = {
      '$alice.example': 0.7,
      '$bob.example': 0.05,
      '$connie.example': 0.25,
    };

    const picked = {
      '$alice.example': 0,
      '$bob.example': 0,
      '$connie.example': 0,
    };

    const expectedPickingChancesOrder = [
      '$alice.example',
      '$connie.example',
      '$bob.example',
    ];

    monetize.pointerPerTime(pointers)
      .then(() => {
        expect(pointers).toContain(monetize.activePointer);
      });

    setInterval(() => {
      const item = monetize.pickByProbability(pointers);
      // eslint-disable-next-line no-prototype-builtins
      if (picked.hasOwnProperty(item)) {
        picked[item] += 1;
      }
    }, 1);

    return (new Promise((res) => setTimeout(() => {
      res();
    }, 50))).then(() => {
      let lastFrequency = -1;
      let acceptableFrequencyOrder = true;

      expectedPickingChancesOrder.forEach((pointer) => {
        const currentFrequency = picked[pointer];
        if (lastFrequency > 0 && currentFrequency > lastFrequency) {
          acceptableFrequencyOrder = false;
        }

        lastFrequency = currentFrequency;
      });

      expect(acceptableFrequencyOrder).toBeTruthy();
    });
  });

  test('it return nothing when no pointers has been passed to probabilistic pickup', () => {
    expect(monetize.pickByProbability([])).toBeFalsy();
  });
});
