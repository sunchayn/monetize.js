import monetize from '../../src/monetize';

const MonetizationFake = require('../fake/monetization');

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
  test('it resolve on start events', () => {
    monetize.when('start').then((data) => {
      expect(data.paymentPointer).toBeTruthy();
      expect(data.requestId).toBeTruthy();
    });

    document.monetization.fire('monetizationstart');

    expect.assertions(2);
  });

  test('it resolve on pending events', () => {
    monetize.when('pending').then((data) => {
      expect(data.paymentPointer).toBeTruthy();
      expect(data.requestId).toBeTruthy();
    });

    document.monetization.fire('monetizationpending');

    expect.assertions(2);
  });

  test('it resolve on progress events', () => {
    const detail = {
      amount: 22,
      assetCode: 'XRP',
    };

    monetize.when('progress').then((data) => {
      expect(data.amount).toEqual(detail.amount);
      expect(data.assetCode).toEqual(detail.assetCode);
    });

    document.monetization.fire('monetizationprogress', { detail });
    expect.assertions(2);
  });

  test('it resolve on stop events', () => {
    monetize.when('stop').then((data) => {
      expect(data.paymentPointer).toBeTruthy();
      expect(data.requestId).toBeTruthy();
    });

    document.monetization.fire('monetizationstop');
    expect.assertions(2);
  });

  test('it does not recognize invalid events', () => {
    monetize.when('foo').then().catch((e) => {
      expect(e.message).toEqual('Event \'foo\' is not supported.');
    });

    expect.assertions(1);
  });
});
