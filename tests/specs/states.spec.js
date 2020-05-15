import monetize from '../../src';

const MonetizationFake = require('../fake/monetization');

beforeEach(() => {
  document.monetization = new MonetizationFake();
  monetize.refresh();
});

describe('Configuration', () => {
  test('it properly update monetization state when started', () => {
    document.monetization.fire('monetizationstart');
    expect(monetize.isSending()).toBeTruthy();
  });

  test('it properly update monetization state when pending', () => {
    document.monetization.fire('monetizationpending');
    expect(monetize.isPending()).toBeTruthy();
  });

  test('it properly update monetization state when stopped', () => {
    document.monetization.fire('monetizationstop');
    expect(monetize.isStopped()).toBeTruthy();
  });
});
