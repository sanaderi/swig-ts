import { address, type Address } from '@solana/kit';
import {
  ACTION_HEADER_LENGTH,
  getActionHeaderDecoder,
  Permission,
  type ActionHeader,
} from '@swig-wallet/coder';
import bs58 from 'bs58';
import { ActionsBuilder } from './builder';
import { SpendController } from './control';
import {
  decodeActionPayload,
  isActionPayload,
  type ActionPayload,
} from './payload';

/**
 * Utility class from managing actions grouped together.
 */
export class Actions {
  private constructor(
    /**
     * action buffer
     */
    private readonly raw: Uint8Array,
    private readonly actions: Action[],
  ) {}

  /**
   * Creates a new action
   * @param raw Buffer of a given number of actions
   * @param count number of actions
   * @returns Actions
   */
  static from(raw: Uint8Array, count: number) {
    const actions = deserializeActions(raw, count);
    return new Actions(raw, actions);
  }

  /**
   * Returns a builder for chaining actions together.
   * Call `.set()` at the end of the chain to put these actions together
   * @returns ActionsBuilder
   */
  static set(): ActionsBuilder {
    return ActionsBuilder.new();
  }

  /**
   * Number of actions
   */
  get count() {
    return this.actions.length;
  }

  bytes() {
    return this.raw;
  }

  /**
   * Check if root action is present
   * @returns boolean
   */
  isRoot(): boolean {
    return !!this.actions.find((action) => action.isRoot());
  }

  /**
   * Check if authority manager action is present
   * @returns boolean
   */
  canManageAuthority(): boolean {
    return !!this.actions.find((action) => action.canManageAuthority());
  }

  /**
   * Check if the action can interact with a given program
   * @param programId ID of the Program to interact with
   * @returns boolean
   */
  canUseProgram(programId: Address): boolean {
    return !!this.actions.find((action) => action.canUseProgram(programId));
  }

  /**
   * Check if Sol Spend is uncapped
   * @returns boolean
   */
  canSpendSolMax(): boolean {
    return !!this.actions.find((action) => action.solControl().canSpendMax());
  }

  /**
   * Check if Sol Spend is allowed. If `amount` is provided,
   * it will return `true` if the action can spend the given amount of Sol
   * @param amount - minimum spendable amount
   * @returns boolean
   */
  canSpendSol(amount?: bigint): boolean {
    return !!this.actions.find((action) =>
      action.solControl().canSpend(amount),
    );
  }

  /**
   * Gets the spend limit for SOL. Returns null if the spend is uncapped.
   * @returns `bigint` | `null`
   */
  solSpendLimit(): bigint | null {
    for (const action of this.actions) {
      const limit = action.solControl().spendLimit;
      if (limit === null) return null;
    }
    return this.actions.reduce((max, val) => {
      const limit = val.solControl().spendLimit!;
      return limit > max ? limit : max;
    }, 0n);
  }

  /**
   * Get Sol {@link SpendController} for the actions
   * @returns SpendController
   */
  solSpend(): SpendController {
    for (const action of this.actions) {
      const limit = action.solControl().spendLimit;
      if (limit === null) return action.solControl();
    }
    const action = this.actions.find((a) => a.solControl().spendLimit != null);
    return action ? action.solControl() : SpendController.none();
  }

  /**
   * Check if Token Spend is uncapped
   * @param mint Token mint
   * @returns boolean
   */
  canSpendTokenMax(mint: Address): boolean {
    return !!this.actions.find((action) =>
      action.tokenControl(mint).canSpendMax(),
    );
  }

  /**
   * Check if Token Spend is allowed. If `amount` is provided,
   * it will return `true` if the action can spend the given amount of tokens
   * @param mint Token mint
   * @param [amount] Minimum spendable amount
   * @returns boolean
   */
  canSpendToken(mint: Address, amount?: bigint): boolean {
    return !!this.actions.find((action) =>
      action.tokenControl(mint).canSpend(amount),
    );
  }

  /**
   * Gets the spend limit for a given token mint. Returns null if the spend is uncapped.
   * @param mint Token mint
   * @returns `bigint` | `null`
   */
  tokenSpendLimit(mint: Address): bigint | null {
    let maxLimit: bigint | null = null;

    for (const action of this.actions) {
      const limit = action.tokenControl(mint).spendLimit;
      if (limit === null) return null; // If any action has an uncapped limit, return null
      if (maxLimit === null || limit > maxLimit) maxLimit = limit; // Track the maximum limit
    }

    return maxLimit ?? 0n; // Return 0n if no limits are found
  }

  /**
   * Get token {@link SpendController} for the actions
   * @param mint Token mint
   * @returns SpendController
   */
  tokenSpend(mint: Address): SpendController {
    for (const action of this.actions) {
      const limit = action.tokenControl(mint).spendLimit;
      if (limit === null) return action.tokenControl(mint);
    }
    const action = this.actions.find(
      (a) => a.tokenControl(mint).spendLimit != null,
    );
    return action ? action.tokenControl(mint) : SpendController.none();
  }
}

function deserializeActions(
  actionsBuffer: Uint8Array,
  count: number,
): Action[] {
  let cursor = 0;
  const actions: Action[] = [];

  for (let i = 0; i < count; i++) {
    const headerRaw = actionsBuffer.slice(
      cursor,
      cursor + ACTION_HEADER_LENGTH,
    );
    const header = getActionHeaderDecoder().decode(headerRaw);
    cursor += ACTION_HEADER_LENGTH;

    const payloadRaw = actionsBuffer.slice(cursor, header.boundary);
    const payload = decodeActionPayload(header.permission, payloadRaw);
    cursor = header.boundary;

    actions.push(Action.from(header, payload));
  }

  return actions;
}

/**
 * Utility class for a Swig Action
 */
class Action {
  private constructor(
    private header: ActionHeader,
    private payload: ActionPayload,
  ) {}

  get permission() {
    return this.header.permission;
  }

  static from(header: ActionHeader, payload: ActionPayload): Action {
    return new Action(header, payload);
  }

  isRoot(): boolean {
    return this.permission === Permission.All;
  }

  /**
   * Check if this action can manage authority
   * @returns `boolean`
   */
  canManageAuthority(): boolean {
    return (
      this.permission === Permission.All ||
      this.permission === Permission.ManageAuthority
    );
  }

  /**
   * Sol Spend controller
   */
  solControl(): SpendController {
    if (isActionPayload(Permission.All, this.payload))
      return SpendController.max();

    if (
      isActionPayload(Permission.SolLimit, this.payload) ||
      isActionPayload(Permission.SolRecurringLimit, this.payload)
    ) {
      return SpendController.get(this.payload);
    }

    return SpendController.none();
  }

  /**
   * Current spendable amount. Returns `null` if spend is uncapped
   */
  solSpendLimit(): bigint | null {
    return this.solControl().spendLimit;
  }

  /**
   * Token Spend controller
   */
  tokenControl(mint: Address): SpendController {
    if (isActionPayload(Permission.All, this.payload)) {
      return SpendController.max();
    }

    if (
      isActionPayload(Permission.TokenLimit, this.payload) ||
      isActionPayload(Permission.TokenRecurringLimit, this.payload)
    ) {
      const payloadMint = bs58.encode(Uint8Array.from(this.payload.data.mint));
      const providedMint = mint.toString();

      if (payloadMint === providedMint) {
        return SpendController.get(this.payload);
      }
    }
    return SpendController.none();
  }

  /**
   * Check action use program
   */
  canUseProgram(program: Address): boolean {
    if (isActionPayload(Permission.All, this.payload)) return true;

    if (isActionPayload(Permission.Program, this.payload)) {
      return (
        program ===
        address(bs58.encode(Uint8Array.from(this.payload.data.programId)))
      );
    }

    return false;
  }
}
