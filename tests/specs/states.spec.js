import monetize from '../../src/monetize';

const MonetizationFake = require('../fake/monetization');

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

describe('States', () => {
  test('it properly set monetization state when started', () => {
    document.monetization.fire('monetizationstart');
    expect(monetize.isSending()).toBeTruthy();
  });

  test('it properly set monetization state when progressed', () => {
    document.monetization.fire('monetizationprogress');
    expect(monetize.isSending()).toBeTruthy();
  });

  test('it properly set monetization state when pending', () => {
    document.monetization.fire('monetizationpending');
    expect(monetize.isPending()).toBeTruthy();
  });

  test('it properly set monetization state when stopped', () => {
    document.monetization.fire('monetizationstop');
    expect(monetize.isStopped()).toBeTruthy();
  });
});
