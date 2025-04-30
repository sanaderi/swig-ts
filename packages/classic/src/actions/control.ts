import { Permission } from '@swig/coder';
import { isActionPayload, type ActionPayload } from './action';

export class SpendController {
  private constructor(private readonly spendControl: SpendControl) {}

  get isAllowed(): boolean {
    return this.spendControl.hasControl;
  }
  /**
   * max spendable amount.
   *
   * returns `null` if there is no limit
   */
  get spendLimit(): bigint | null {
    if (!this.isAllowed) return 0n;
    return this.spendControl.amount;
  }

  get window(): bigint | null {
    return this.spendControl.window ?? null;
  }

  get lastReset(): bigint | undefined {
    return this.spendControl.lastReset;
  }

  get recurringLimit(): bigint | undefined {
    return this.spendControl.recurringAmount;
  }

  canSpendMax(): boolean {
    return this.spendLimit === null;
  }

  canSpend(amount?: bigint): boolean {
    return amount ? this.withinLimits(amount) : this.isAllowed;
  }

  private withinLimits(amount: bigint): boolean {
    return (
      this.isAllowed && (this.spendLimit === null || this.spendLimit >= amount)
    );
  }

  static get(action: ActionPayload): SpendController {
    if (
      isActionPayload(Permission.SolRecurringLimit, action) ||
      isActionPayload(Permission.TokenRecurringLimit, action)
    ) {
      return SpendController.recurring({
        amount: action.data.currentAmount,
        ...action.data,
      });
    }

    if (
      isActionPayload(Permission.SolLimit, action) ||
      isActionPayload(Permission.TokenLimit, action)
    ) {
      return SpendController.once(action.data.amount);
    }

    if (isActionPayload(Permission.All, action)) {
      return SpendController.all();
    }

    return SpendController.noControl();
  }

  static noControl(): SpendController {
    return new SpendController({
      hasControl: false,
      amount: null,
    });
  }

  static all(): SpendController {
    return new SpendController({
      hasControl: true,
      amount: null,
    });
  }

  // once
  static once(amount: bigint): SpendController {
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
  }): SpendController {
    return new this({
      ...args,
      hasControl: true,
    });
  }
}

export type SpendControl = {
  hasControl: boolean;
  amount: bigint | null;
  window?: bigint;
  lastReset?: bigint;
  recurringAmount?: bigint;
};
