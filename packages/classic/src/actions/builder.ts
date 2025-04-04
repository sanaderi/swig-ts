import { PublicKey } from '@solana/web3.js';
import { action, solAction, tokenAction, type Action } from '@swig/coder';
import { SwigActions } from './swig';

export class SwigActionsBuilder {
  private _actions: Action[] = [];

  private constructor() {}

  static new() {
    return new SwigActionsBuilder();
  }

  get(): SwigActions {
    return new SwigActions(this._actions);
  }

  all(): this {
    this._actions.push(action('All'));
    return this;
  }

  manageAuthority(): this {
    this._actions.push(action('ManageAuthority'));
    return this;
  }

  solAll(): this {
    this._actions.push(action('Sol', { action: solAction('All') }));
    return this;
  }

  solManage(amount: bigint) {
    this._actions.push(
      action('Sol', { action: solAction('Manage', [amount]) }),
    );
    return this;
  }

  solTemporal(args: {
    amount: bigint;
    window: bigint;
    last: bigint;
  }): this {
    this._actions.push(
      action('Sol', {
        action: solAction('Temporal', [args.amount, args.window, args.last]),
      }),
    );
    return this;
  }

  tokenAll(args: { key: PublicKey }): this {
    this._actions.push(
      action('Token', { key: args.key.toBytes(), action: tokenAction('All') }),
    );
    return this;
  }

  tokenManage(args: { key: PublicKey; amount: bigint }): this {
    this._actions.push(
      action('Token', {
        key: args.key.toBytes(),
        action: tokenAction('Manage', [args.amount]),
      }),
    );
    return this;
  }

  tokenTemporal(args: {
    key: PublicKey;
    amount: bigint;
    window: bigint;
    last: bigint;
  }): this {
    this._actions.push(
      action('Token', {
        key: args.key.toBytes(),
        action: tokenAction('Temporal', [args.amount, args.window, args.last]),
      }),
    );
    return this;
  }

  tokensAll(): this {
    this._actions.push(action('Tokens', { action: solAction('All') }));
    return this;
  }

  tokensManage(amount: bigint): this {
    this._actions.push(
      action('Tokens', { action: solAction('Manage', [amount]) }),
    );
    return this;
  }

  tokensTemporal(args: {
    amount: bigint;
    window: bigint;
    last: bigint;
  }): this {
    this._actions.push(
      action('Tokens', {
        action: solAction('Temporal', [args.amount, args.window, args.last]),
      }),
    );
    return this;
  }

  program(args: { key: PublicKey }): this {
    this._actions.push(action('Program', { key: args.key.toBytes() }));
    return this;
  }

  removeIndex(index: number): this {
    this._actions = this._actions.filter((_, i) => i !== index);
    return this;
  }
}
