import monetize from '../../src/monetize';

// const Promise = require('promise-polyfill');
const MonetizationFake = require('../fake/monetization');

// Helper delay execution
const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

afterEach(() => {
  const metaTag = document.querySelector('meta[name="monetization"]');
  if (metaTag) {
    metaTag.remove();
  }
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
    document.monetization.fireAfter('monetizationstart', 5);

    monetize.pointer('$wallet').then((watcher) => {
      expect(watcher).toBeDefined();
      expect(watcher.event).toBeTruthy();
    });

    return wait(10).then(() => {
      expect.assertions(2);
    });
  });

  test('it detect pointer from the meta tag.', () => {
    const pointer = '$test';
    monetize.setupMetaTag(pointer);

    document.monetization.fireAfter('monetizationstart', 5);

    monetize.pointer().then(() => {
      expect(monetize.activePointer).toEqual(pointer);
    });

    return wait(10).then(() => {
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

  test('it add proper meta tag', () => {
    const pointer = '$wallet';

    // Setup monetization
    monetize.pointer(pointer);

    const tag = document.querySelector('meta[name="monetization"]');
    expect(tag).toBeInstanceOf(HTMLMetaElement);
    expect(tag.getAttribute('content')).toEqual(pointer);
  });

  test('it randomly cycle through multiple pointers', () => {
    document.monetization.fireAfter('monetizationstart', 5);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    const checked = [];
    monetize.pointers(pointers, 1).then(() => {
      const timer = setInterval(() => {
        if (!checked.includes(monetize.activePointer)) {
          checked.push(monetize.activePointer);
        }

        if (checked.length === pointers.length) {
          clearInterval(timer);
        }
      }, 1);
    });

    return wait(50).then(() => {
      expect(checked.length).toEqual(pointers.length);
    });
  });

  test('it can use custom callback cycle through multiple pointers', () => {
    expect.assertions(1);
    document.monetization.fireAfter('monetizationstart', 5);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    const indexToUse = 2;
    let onlyOneItemIsReturned = false;

    monetize.pointers(pointers, 1, (elements) => elements[indexToUse])
      .then(() => {
        onlyOneItemIsReturned = true;
        const timer = setInterval(() => {
          if (monetize.activePointer !== pointers[indexToUse]) {
            onlyOneItemIsReturned = false;
            clearInterval(timer);
          }
        }, 1);
      });

    return wait(50).then(() => {
      expect(onlyOneItemIsReturned).toBeTruthy();
    });
  });

  test('it can randomly pick a pointer from list', () => {
    document.monetization.fireAfter('monetizationstart', 5);

    const pointers = [
      '$wallet',
      '$wallet2',
      '$wallet3',
    ];

    monetize.pointerPerTime(pointers).then(() => {
    });

    return wait(50).then(() => {
      expect(pointers).toContain(monetize.activePointer);
    });
  });

  test('it can randomly pick a pointer from list by its probability', () => {
    document.monetization.fireAfter('monetizationstart', 5);

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
        expect(pointers.hasOwnProperty(monetize.activePointer)).toBeTruthy();
      });

    setInterval(() => {
      const item = monetize.pickByProbability(pointers);
      // eslint-disable-next-line no-prototype-builtins
      if (picked.hasOwnProperty(item)) {
        picked[item] += 1;
      }
    }, 1);

    return wait(50).then(() => {
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
