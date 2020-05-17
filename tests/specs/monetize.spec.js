// eslint-disable-next-line import/no-extraneous-dependencies
import MutationObserver from 'mutationobserver-shim';
import monetize from '../../src/monetize';
import Watcher from '../../src/core/Watcher';

// const Promise = require('promise-polyfill');
const MonetizationFake = require('../fake/monetization');

// Helper delay execution
const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

global.MutationObserver = MutationObserver;

const removePointerTag = () => {
  const metaTag = document.querySelector('meta[name="monetization"]');
  if (metaTag) {
    metaTag.remove();
  }
};

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

afterEach(() => {
  removePointerTag();
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

  test('it add proper meta tag.', () => {
    const pointer = '$wallet';

    // Setup monetization
    monetize.pointer(pointer);

    const tag = document.querySelector('meta[name="monetization"]');
    expect(tag).toBeInstanceOf(HTMLMetaElement);
    expect(tag.getAttribute('content')).toEqual(pointer);
  });

  test('it resolve the promise when event is fired.', () => {
    document.monetization.fireAfter('monetizationstart', 2);

    monetize.pointer('$wallet').then((watcher) => {
      expect(watcher).toBeInstanceOf(Watcher);
    });

    return wait(5).then(() => {
      expect.assertions(1);
    });
  });

  test('it throw error when setup with disabled monetization.', () => {
    document.monetization = null;
    monetize.refresh();

    monetize.pointer('$wallet 2').catch((e) => expect(e.message).toMatch('Web monetization is not enabled in this browser.'));

    return wait(10).then(() => {
      expect.assertions(1);
    });
  });

  test('it throw error when setup while wallet is not passed.', () => {
    monetize.pointer().catch((e) => expect(e.message).toMatch('You have to provide a wallet.'));

    return wait(10).then(() => {
      expect.assertions(1);
    });
  });

  test('it sequentially cycle through multiple pointers.', () => {
    document.monetization.fireAfter('monetizationstart', 5);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    const checked = [];
    let timer = null;

    monetize.cycle(pointers, 5).then(() => {
      timer = setInterval(() => {
        if (!checked.includes(monetize.activePointer)) {
          checked.push(monetize.activePointer);
        }

        if (checked.length === pointers.length) {
          clearInterval(timer);
        }
      }, 2);
    });

    return wait(20).then(() => {
      clearInterval(timer);
      expect(checked.length).toEqual(pointers.length);
    });
  });

  test('it can use custom callback cycle through multiple cycle.', () => {
    expect.assertions(1);
    document.monetization.fireAfter('monetizationstart', 5);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    const indexToUse = 2;
    let onlyOneItemIsReturned = false;

    let timer = null;
    monetize.cycle(pointers, 1, (elements) => elements[indexToUse])
      .then(() => {
        onlyOneItemIsReturned = true;
        timer = setInterval(() => {
          if (monetize.activePointer !== pointers[indexToUse]) {
            onlyOneItemIsReturned = false;
            clearInterval(timer);
          }
        }, 1);
      });

    return wait(10).then(() => {
      clearInterval(timer);
      expect(onlyOneItemIsReturned).toBeTruthy();
    });
  });

  test('it can randomly pick a pointer from list.', () => {
    expect.assertions(1);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    monetize.pluck(pointers);

    // Block the test so the head won't be cleared before assertion (by afterEach method).
    return wait(5).then(() => {
      expect(pointers.indexOf(monetize.activePointer)).toBeGreaterThanOrEqual(0);
    });
  });

  test('it can randomly pick a pointer from list by its probability.', () => {
    document.monetization.fireAfter('monetizationstart', 5);

    const pointers = {
      '$alice.example': 0.6,
      '$bob.example': 0.05,
      '$connie.example': 0.30,
    };

    const picked = {
      '$alice.example': -1,
      '$bob.example': -1,
      '$connie.example': -1,
    };

    const expectedPickingChancesOrder = [
      '$alice.example',
      '$connie.example',
      '$bob.example',
    ];

    const timer = setInterval(() => {
      const item = monetize._getLuckyPointer(pointers);

      // eslint-disable-next-line no-prototype-builtins
      if (picked.hasOwnProperty(item)) {
        picked[item] += 1;
      }
    }, 1);


    return wait(40).then(() => {
      clearInterval(timer);

      let lastFrequency = null;
      let acceptableFrequencyOrder = true;

      expectedPickingChancesOrder.forEach((pointer) => {
        const currentFrequency = picked[pointer];
        if (lastFrequency === -1 || (lastFrequency && currentFrequency > lastFrequency)) {
          acceptableFrequencyOrder = false;
        }

        lastFrequency = currentFrequency;
      });

      expect(acceptableFrequencyOrder).toBeTruthy();
    });
  });

  test('it can randomly cycle through pointers by their probability.', () => {
    const pointers = {
      '$alice.example': 0.75,
      '$bob.example': 0.05,
      '$connie.example': 0.20,
    };

    const picked = {
      '$alice.example': -1,
      '$bob.example': -1,
      '$connie.example': -1,
    };

    const expectedPickingChancesOrder = [
      '$alice.example',
      '$connie.example',
      '$bob.example',
    ];

    monetize.probabilisticCycle(pointers, 2);

    const timer = setInterval(() => {
      const item = monetize.activePointer;
      // eslint-disable-next-line no-prototype-builtins
      if (picked.hasOwnProperty(item)) {
        picked[item] += 1;
      }
    }, 1);

    expect.assertions(1);
    return wait(25).then(() => {
      clearInterval(timer);

      let lastFrequency = null;
      let acceptableFrequencyOrder = true;

      expectedPickingChancesOrder.forEach((pointer) => {
        const currentFrequency = picked[pointer];
        if (lastFrequency === -1 || (lastFrequency && currentFrequency > lastFrequency)) {
          acceptableFrequencyOrder = false;
        }

        lastFrequency = currentFrequency;
      });

      expect(acceptableFrequencyOrder).toBeTruthy();
    });
  });

  test('it return nothing when no cycle has been passed to probabilistic pickup.', () => {
    expect.assertions(1);
    monetize.pluck({}).catch((error) => {
      expect(error.message).toEqual('You have to provide a wallet.');
    });
  });

  test('it listen to head changes to update pointer.', () => {
    const pointer = '$test.observable';

    const tag = document.createElement('meta');
    tag.name = 'monetization';
    tag.content = pointer;

    document.head.appendChild(tag);

    // Block the test so the head won't be cleared before assertion (by afterEach method).
    return wait(1).then(() => {
      expect(monetize.activePointer).toEqual(pointer);
    });
  });
});
