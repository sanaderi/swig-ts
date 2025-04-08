import { Permission } from '@swig/coder';
import { isActionPayload, type ActionPayload } from './action';

export class BalanceController {
  private constructor(private readonly balanceControl: BalanceControl) {}

  get amount(): bigint | null {
    return this.balanceControl.amount;
  }

  get window(): bigint | null {
    return this.balanceControl.window || null;
  }

  get lastReset(): bigint | null {
    return this.balanceControl.lastReset || null;
  }

  get isAllowed(): boolean {
    return this.balanceControl.hasControl;
  }

  canSpendMax(): boolean {
    return this.isAllowed && this.amount === null;
  }

  canSpend(amount?: bigint): boolean {
    if (!amount) return this.isAllowed;
    return this.isAllowed && this.withinLimits(amount);
  }

  private withinLimits(amount: bigint): boolean {
    return this.amount === null || this.amount >= amount;
  }

  static get(action: ActionPayload): BalanceController {
    if (
      isActionPayload(Permission.SolRecurringLimit, action) ||
      isActionPayload(Permission.TokenRecurringLimit, action)
    ) {
      return BalanceController.recurring({
        amount: action.data.currentAmount,
        ...action.data,
      });
    }

    if (
      isActionPayload(Permission.SolLimit, action) ||
      isActionPayload(Permission.TokenLimit, action)
    ) {
      return BalanceController.once(action.data.amount);
    }

    if (isActionPayload(Permission.All, action)) {
      return BalanceController.all();
    }

    return BalanceController.noControl();
  }

  static noControl(): BalanceController {
    return new BalanceController({
      hasControl: false,
      amount: null,
    });
  }

  static all(): BalanceController {
    return new BalanceController({
      hasControl: true,
      amount: null,
    });
  }

  // once
  static once(amount: bigint): BalanceController {
    return new this({
      hasControl: true,
      amount,
    });
  }

  // recurring
  static recurring(args: {
    amount: bigint;
    window: bigint;
    lastReset: bigint;
    recurringAmount: bigint;
  }): BalanceController {
    return new this({
      ...args,
      hasControl: true,
    });
  }
}

export type BalanceControl = {
  hasControl: boolean;
  amount: bigint | null;
  window?: bigint;
  lastReset?: bigint;
  recurringAmount?: bigint;
};
