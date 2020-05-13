const monetize = require('../../src/index.js');
const MonetizationFake = require('../fake/monetization');

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

describe('Amount API', () => {
  test('it properly calculate the total for a given pointer', () => {
    expect.assertions(7);
    const pointer = '$wallet';
    const pointer2 = '$wallet2';

    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer(pointer).then(() => {
      const detail = {
        amount: 22,
        assetCode: 'XRP',
      };

      // Amount first time updated for the first pointer
      document.monetization.fire('monetizationprogress', { detail });

      expect(monetize.amount.getPointerCurrency()).toBeFalsy();
      expect(monetize.amount.getPointerCurrency(pointer)).toEqual(detail.assetCode);
      expect(monetize.amount.getPointerTotal(pointer)).toEqual(detail.amount);

      // Amount updated for the same pointer
      document.monetization.fire('monetizationprogress', { detail });
      expect(monetize.amount.getPointerTotal(pointer)).toEqual(detail.amount * 2);

      // Amount updated for another pointer
      monetize.update(pointer2);

      document.monetization.fire('monetizationprogress', { detail });
      expect(monetize.amount.getPointerTotal(pointer)).toEqual(detail.amount * 2);
      expect(monetize.amount.getPointerTotal(pointer2)).toEqual(detail.amount);

      // The total is properly summed.
      expect(monetize.amount.total()).toEqual(detail.amount * 3);
    });
  });

  test('it return null when pointer is not found', () => {
    expect(monetize.amount.getPointerTotal('$invalid_wallet')).toBeFalsy();
  });

  test('it format amount properly', () => {
    const pointer = '$wallet';

    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer(pointer).then(() => {
      const detail = {
        amount: 22,
        assetCode: 'USD',
        assetScale: 2,
      };

      // Fire the progress event twice
      document.monetization.fire('monetizationprogress', { detail });
      document.monetization.fire('monetizationprogress', { detail });

      // eslint-disable-next-line max-len
      const expectedAmount = ((detail.amount * 2) * (10 ** -detail.assetScale)).toFixed(detail.assetScale);

      expect(monetize.amount.getPointerTotal(pointer, true)).toEqual(expectedAmount);
      expect(monetize.amount.total(true).toString()).toEqual(expectedAmount);
    });
  });

  test('total amount with one currency is properly calculated', () => {
    const pointer = '$wallet';
    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer(pointer).then(() => {
      const detail = {
        amount: 22,
        assetCode: 'USD',
        assetScale: 2,
      };

      // Fire multiple events
      document.monetization.fire('monetizationprogress', { detail });
      document.monetization.fire('monetizationprogress', { detail });

      expect(monetize.amount.total()).toEqual(detail.amount * 2);
    });
  });

  test('total amount with multiple currency is properly calculated', () => {
    const pointer = '$wallet';
    const pointer2 = '$wallet2';

    document.monetization.fireAfter('monetizationstart', 100);

    return monetize.pointer(pointer).then(() => {
      const detail = {
        amount: 22,
        assetCode: 'USD',
        assetScale: 2,
      };

      const detail2 = {
        amount: 40,
        assetCode: 'XRP',
        assetScale: 2,
      };

      // Fire the progress event twice
      document.monetization.fire('monetizationprogress', { detail });
      document.monetization.fire('monetizationprogress', { detail });

      monetize.update(pointer2);
      document.monetization.fire('monetizationprogress', { detail: detail2 });

      const total = monetize.amount.total();

      expect(total.USD).toEqual(detail.amount * 2);
      expect(total.XRP).toEqual(detail2.amount);
    });
  });
});
