import { type Address } from '@solana/kit';
import { Actions } from '../src/actions/action';

const dummyAddress = (): Address =>
  '11111111111111111111111111111111' as Address;
const dummyAddress2 = (): Address =>
  '4Nd1mYwq3pR9bN9bA5uQK2gqVjQhQhQhQhQhQhQhQhQh' as Address;

describe('Actions', () => {
  it('tracks spend limits separately for different mints', () => {
    const mint1 = dummyAddress();
    const mint2 = dummyAddress2();
    const actions = Actions.set()
      .tokenLimit({ mint: mint1, amount: 100n })
      .tokenLimit({ mint: mint2, amount: 200n })
      .get();

    expect(actions.tokenSpendLimit(mint1)).toBe(100n);
    expect(actions.tokenSpendLimit(mint2)).toBe(200n);
  });

  it('returns none SpendController when no SOL spend action exists', () => {
    const actions = Actions.set()
      .programLimit({ programId: dummyAddress() })
      .get();
    const controller = actions.solSpend();
    expect(controller.isAllowed).toBe(false);
    expect(controller.spendLimit).toBe(0n);
  });

  it('returns none SpendController when no token spend action exists', () => {
    const mint = dummyAddress();
    const actions = Actions.set()
      .programLimit({ programId: dummyAddress() })
      .get();
    const controller = actions.tokenSpend(mint);
    expect(controller.isAllowed).toBe(false);
    expect(controller.spendLimit).toBe(0n);
  });

  it('returns max SOL spend when using root permission', () => {
    const actions = Actions.set().all().get();
    const controller = actions.solSpend();
    expect(controller.isAllowed).toBe(true);
    expect(controller.spendLimit).toBe(null); // uncapped
    expect(controller.canSpend(100000000000000n)).toBe(true);
  });

  it('returns max token spend when using root permission', () => {
    const mint = dummyAddress();
    const actions = Actions.set().all().get();
    const controller = actions.tokenSpend(mint);
    expect(controller.isAllowed).toBe(true);
    expect(controller.spendLimit).toBe(null); // uncapped
    expect(controller.canSpend(10_000n)).toBe(true);
  });

  it('returns the maximum spend limit when multiple SOL spend limits exist', () => {
    const actions = Actions.set()
      .solLimit({ amount: 200n })
      .solLimit({ amount: 500n })
      .solLimit({ amount: 100n })
      .get();

    expect(actions.solSpendLimit()).toBe(500n);
  });

  it('returns null for SOL spend limit if any is uncapped', () => {
    const actions = Actions.set()
      .solLimit({ amount: 300n })
      .all() // uncapped
      .get();

    expect(actions.solSpendLimit()).toBe(null);
  });

  it('returns null for token spend limit if any is uncapped', () => {
    const mint = dummyAddress();
    const actions = Actions.set()
      .tokenLimit({ mint, amount: 300n })
      .all() // uncapped
      .get();

    expect(actions.tokenSpendLimit(mint)).toBe(null);
  });

  it('returns max token spend limit among multiple token limits', () => {
    const mint = dummyAddress();
    const actions = Actions.set()
      .tokenLimit({ mint, amount: 250n })
      .tokenLimit({ mint, amount: 700n })
      .get();

    expect(actions.tokenSpendLimit(mint)).toBe(700n);
  });
});
