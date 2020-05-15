import monetize from '../../src/monetize';

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

describe('Watcher API', () => {
  test('it resolve on pending events', () => {
    document.monetization.fireAfter('monetizationstart', 2);
    document.monetization.fireAfter('monetizationpending', 5);

    monetize.pointer('$wallet').then((watcher) => {
      watcher.when('pending').then((data) => {
        expect(data.paymentPointer).toBeTruthy();
        expect(data.requestId).toBeTruthy();
      });
    });

    return wait(30).then(() => {
      expect.assertions(2);
    });
  });

  test('it resolve on progress events', () => {
    const detail = {
      amount: 22,
      assetCode: 'XRP',
    };

    document.monetization.fireAfter('monetizationstart', 3);
    document.monetization.fireAfter('monetizationprogress', 10, { detail });

    monetize.pointer('$wallet').then((watcher) => {
      watcher.when('progress').then((data) => {
        expect(data.amount).toEqual(detail.amount);
        expect(data.assetCode).toEqual(detail.assetCode);
      });
    });

    return wait(20).then(() => {
      expect.assertions(2);
    });
  });

  test('it resolve on stop events', () => {
    document.monetization.fireAfter('monetizationstart', 3);
    document.monetization.fireAfter('monetizationstop', 5);

    monetize.pointer('$wallet').then((watcher) => {
      watcher.when('stop').then((data) => {
        expect(data.paymentPointer).toBeTruthy();
        expect(data.requestId).toBeTruthy();
      });
    });

    return wait(10).then(() => {
      expect.assertions(2);
    });
  });

  test('it does not recognize invalid events', () => {
    document.monetization.fireAfter('monetizationstart', 3);

    monetize.pointer('$wallet').then((watcher) => {
      watcher.when('foo').then().catch((e) => {
        expect(e.message).toEqual('Event \'foo\' is not supported.');
      });
    });

    return wait(10).then(() => {
      expect.assertions(1);
    });
  });
});
