const monetize = require('../../src/index.js');
const MonetizationFake = require('../fake/monetization');

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

describe('Watcher API', () => {
  test('it resolve on pending events', () => {
    expect.assertions(2);

    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer('$wallet').then((watcher) => {
      document.monetization.fireAfter('monetizationpending', 100);

      return watcher.when('pending').then((data) => {
        expect(data.paymentPointer).toBeTruthy();
        expect(data.requestId).toBeTruthy();
      });
    });
  });

  test('it resolve on progress events', () => {
    expect.assertions(2);

    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer('$wallet').then((watcher) => {
      const detail = {
        amount: 22,
        assetCode: 'XRP',
      };

      document.monetization.fireAfter('monetizationprogress', 100, { detail });

      return watcher.when('progress').then((data) => {
        expect(data.amount).toEqual(detail.amount);
        expect(data.assetCode).toEqual(detail.assetCode);
      });
    });
  });

  test('it resolve on stop events', () => {
    expect.assertions(2);

    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer('$wallet').then((watcher) => {
      document.monetization.fireAfter('monetizationstop', 100);

      return watcher.when('stop').then((data) => {
        expect(data.paymentPointer).toBeTruthy();
        expect(data.requestId).toBeTruthy();
      });
    });
  });


  test('it does not recognize invalid events', () => {
    expect.assertions(1);

    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer('$wallet').then((watcher) => {
      watcher.when('foo').catch((e) => {
        expect(e.message).toEqual('Event \'foo\' is not supported.');
      });
    });
  });
});
