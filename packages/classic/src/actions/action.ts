import { PublicKey } from '@solana/web3.js';
import {
  ACTION_HEADER_LENGTH,
  getActionHeaderDecoder,
  getProgramLimitDecoder,
  getSolLimitDecoder,
  getSolRecurringLimitDecoder,
  getSubAccountDecoder,
  getTokenLimitDecoder,
  getTokenRecurringLimitDecoder,
  Permission,
  POSITION_LENGTH,
  type ActionHeader,
  type ProgramLimit,
  type SolLimit,
  type SolRecurringLimit,
  type SubAccount,
  type TokenLimit,
  type TokenRecurringLimit,
} from '@swig/coder';
import { ActionsBuilder } from './builder';
import { BalanceController } from './control';

export class Action {
  constructor(
    private header: ActionHeader,
    private payload: ActionPayload,
  ) {}

  get permission() {
    return this.header.permission;
  }

  isAll(): boolean {
    return this.permission === Permission.All;
  }

  canManageAuthority() {
    return (
      this.permission === Permission.All ||
      this.permission === Permission.ManageAuthority
    );
  }

  solControl(): BalanceController {
    if (isActionPayload(Permission.All, this.payload)) {
      return BalanceController.all();
    }

    if (
      isActionPayload(Permission.SolLimit, this.payload) ||
      isActionPayload(Permission.SolRecurringLimit, this.payload)
    ) {
      return BalanceController.get(this.payload);
    }

    return BalanceController.noControl();
  }

  tokenControl(mint: PublicKey): BalanceController {
    if (isActionPayload(Permission.All, this.payload)) {
      return BalanceController.all();
    }

    if (
      isActionPayload(Permission.TokenLimit, this.payload) ||
      isActionPayload(Permission.TokenRecurringLimit, this.payload)
    ) {
      if (
        mint.toBase58() === new PublicKey(this.payload.data.mint).toBase58()
      ) {
        return BalanceController.get(this.payload);
      }
    }

    return BalanceController.noControl();
  }

  canUseProgram(program: PublicKey): boolean {
    if (isActionPayload(Permission.All, this.payload)) {
      return true;
    }

    if (isActionPayload(Permission.Program, this.payload)) {
      if (program.toBase58() === new PublicKey(this.payload.data.programId).toBase58())
        return true;
    }

    return false;
  }
}

export type ActionPayload =
  | { permission: Permission.All }
  | {
      permission: Permission.ManageAuthority;
    }
  | {
      permission: Permission.Program;
      data: ProgramLimit;
    }
  | {
      permission: Permission.SolLimit;
      data: SolLimit;
    }
  | {
      permission: Permission.SolRecurringLimit;
      data: SolRecurringLimit;
    }
  | {
      permission: Permission.SubAccount;
      data: SubAccount;
    }
  | {
      permission: Permission.TokenLimit;
      data: TokenLimit;
    }
  | {
      permission: Permission.TokenRecurringLimit;
      data: TokenRecurringLimit;
    };

export function isActionPayload<P extends ActionPayload['permission']>(
  permission: P,
  action: ActionPayload,
): action is ActionPayload & { permission: P } {
  return permission === action.permission;
}

export function decodeActionPayload(
  permission: Permission,
  data: Uint8Array,
): ActionPayload {
  if (permission === Permission.All) {
    return { permission };
  }

  if (permission === Permission.ManageAuthority) {
    return { permission };
  }

  if (permission === Permission.Program) {
    return { permission, data: getProgramLimitDecoder().decode(data) };
  }

  if (permission === Permission.SolLimit) {
    return { permission, data: getSolLimitDecoder().decode(data) };
  }

  if (permission === Permission.SolRecurringLimit) {
    return { permission, data: getSolRecurringLimitDecoder().decode(data) };
  }

  if (permission === Permission.SubAccount) {
    return { permission, data: getSubAccountDecoder().decode(data) };
  }

  if (permission === Permission.TokenLimit) {
    return { permission, data: getTokenLimitDecoder().decode(data) };
  }

  if (permission === Permission.TokenRecurringLimit) {
    return { permission, data: getTokenRecurringLimitDecoder().decode(data) };
  }

  throw new Error('Invalid Permission');
}

export function deserializeActions(
  actionsBuffer: Uint8Array,
  count: number,
): Action[] {
  let cursor = 0;
  let actions: Action[] = [];

  Array(count).forEach(function (_) {
    let headerRaw = actionsBuffer.slice(cursor, cursor + ACTION_HEADER_LENGTH);
    let header = getActionHeaderDecoder().decode(headerRaw);

    cursor += POSITION_LENGTH;

    let payloadRaw = actionsBuffer.slice(cursor, header.boundary);

    let payload = decodeActionPayload(header.permission, payloadRaw);

    cursor = header.boundary;

    actions.push(new Action(header, payload));
  });

  return actions;
}

export function actionPayload(permission: Permission.All): ActionPayload;
export function actionPayload(
  permission: Permission.ManageAuthority,
): ActionPayload;
export function actionPayload(
  permission: Permission.Program,
  data: ProgramLimit,
): ActionPayload;
export function actionPayload(
  permission: Permission.SolLimit,
  data: SolLimit,
): ActionPayload;
export function actionPayload(
  permission: Permission.SolRecurringLimit,
  data: SolRecurringLimit,
): ActionPayload;
export function actionPayload(
  permission: Permission.SubAccount,
  data: SubAccount,
): ActionPayload;
export function actionPayload(
  permission: Permission.TokenLimit,
  data: TokenLimit,
): ActionPayload;
export function actionPayload(
  permission: Permission.TokenRecurringLimit,
  data: TokenRecurringLimit,
): ActionPayload;
export function actionPayload<P extends Permission, Payload>(
  permission: P,
  data?: Payload,
) {
  return { permission, ...(data ?? {}) };
}

export class Actions {
  private constructor(
    private readonly raw: Uint8Array,
    private readonly actions: Action[],
  ) {}

  static from(raw: Uint8Array, count: number) {
    let actions = deserializeActions(raw, count);
    return new Actions(raw, actions);
  }

  static set(): ActionsBuilder {
    return ActionsBuilder.new();
  }

  get count() {
    return this.actions.length;
  }

  bytes() {
    return this.raw;
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
