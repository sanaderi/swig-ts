import { PublicKey } from '@solana/web3.js';
import { isAction, type Action, type ActionKind } from '@swig/coder';
import { SwigTokenControl } from './token-control';
import { SwigActionsBuilder } from './builder';

export class SwigAction {
  constructor(private readonly action: Action) {}

  get kind(): ActionKind {
    return this.action.__kind;
  }

  isKind(kind: ActionKind) {
    return this.action.__kind === kind;
  }

  isAll(): boolean {
    return this.kind === 'All';
  }

  canManageAuthority() {
    return this.kind === 'All' || this.kind === 'ManageAuthority';
  }

  solControl(): SwigTokenControl {
    if (isAction('All', this.action)) {
      return SwigTokenControl.all();
    }

    if (isAction('Sol', this.action)) {
      return SwigTokenControl.get(this.action.action);
    }

    return SwigTokenControl.noControl();
  }

  allTokensControl(): SwigTokenControl {
    if (isAction('All', this.action)) {
      return SwigTokenControl.all();
    }

    if (isAction('Tokens', this.action)) {
      return SwigTokenControl.get(this.action.action);
    }

    return SwigTokenControl.noControl();
  }

  tokenControl(token: PublicKey): SwigTokenControl {
    if (isAction('All', this.action)) {
      return SwigTokenControl.all();
    }

    if (isAction('Tokens', this.action)) {
      return SwigTokenControl.get(this.action.action);
    }

    if (isAction('Token', this.action)) {
      if (token.toBase58() === new PublicKey(this.action.key).toBase58())
        return SwigTokenControl.get(this.action.action);
    }

    return SwigTokenControl.noControl();
  }

  canUseProgram(program: PublicKey): boolean {
    if (isAction('All', this.action)) {
      return true;
    }

    if (isAction('Program', this.action)) {
      if (program.toBase58() === new PublicKey(this.action.key).toBase58())
        return true;
    }

    return false;
  }
}

export class SwigActions {
  private readonly actions: SwigAction[];

  constructor(private readonly _actions: Action[]) {
    this.actions = _actions.map((action) => new SwigAction(action));
  }

  static set(): SwigActionsBuilder {
    return SwigActionsBuilder.new();
  }

  rawActions(): Action[] {
    return this._actions
  }

  hasAllAction(): boolean {
    return !!this.actions.find((action) => action.isAll());
  }

  canManageAuthority(): boolean {
    return !!this.actions.find((action) => action.canManageAuthority());
  }

  canUseProgram(programId: PublicKey): boolean {
    return !!this.actions.find((action) => action.canUseProgram(programId));
  }

  canSpendSolMax(): boolean {
    return !!this.actions.find((action) => action.solControl().canSpendMax());
  }

  canSpendSol(amount?: bigint): boolean {
    return !!this.actions.find((action) =>
      action.solControl().canSpend(amount),
    );
  }

  canSpendAllTokensMax(): boolean {
    return !!this.actions.find((action) =>
      action.allTokensControl().canSpendMax(),
    );
  }

  canSpendAllTokens(amount?: bigint): boolean {
    return !!this.actions.find((action) =>
      action.allTokensControl().canSpend(amount),
    );
  }

  canSpendTokenMax(mint: PublicKey): boolean {
    return !!this.actions.find((action) =>
      action.tokenControl(mint).canSpendMax(),
    );
  }

  canSpendToken(mint: PublicKey, amount?: bigint): boolean {
    return !!this.actions.find((action) =>
      action.tokenControl(mint).canSpend(amount),
    );
  }
}