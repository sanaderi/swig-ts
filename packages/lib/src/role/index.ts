// import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getPositionDecoder,
  POSITION_LENGTH,
  type Position,
} from '@swig-wallet/coder';
import { Actions, SpendController } from '../actions';
import {
  getRoleAuthority,
  SessionBasedAuthority,
  TokenBasedAuthority,
  type Authority,
  type CreateAuthorityInfo,
  type InstructionDataOptions,
} from '../authority';
import { SolanaPublicKey, type SolInstruction } from '../schema';
import { findSwigSubAccountPda } from '../utils';

export class Role {
  private constructor(
    public readonly swigAddress: SolanaPublicKey,
    private readonly position: Position,
    public readonly authority: Authority,
    public readonly actions: Actions,
    public readonly swigId: Uint8Array,
  ) {}

  static from(
    swigAddress: SolanaPublicKey,
    position: Position,
    roleData: Uint8Array,
    swigId: Uint8Array,
  ) {
    const { actions, authority } = deserializeRoleData(position, roleData);
    return new Role(swigAddress, position, authority, actions, swigId);
  }

  get authorityType() {
    return this.position.authorityType;
  }

  /**
   * role id
   */
  get id() {
    return this.position.id;
  }

  /**
   * Check if the role has a session based authority
   * @returns `boolean`
   */
  isSessionBased(): this is SessionBasedRole {
    return this.authority instanceof SessionBasedAuthority;
  }

  /**
   * Check if the role has a token based authority
   * @returns `boolean`
   */
  isTokenBased(): this is TokenBasedRole {
    return this.authority instanceof TokenBasedAuthority;
  }

  /**
   * Check if the role has root permission
   * @returns `boolean`
   */
  isRoot() {
    return this.actions.isRoot();
  }

  /**
   * check if the role can manage authorities
   * @returns `booean`
   */
  canManageAuthority() {
    return this.actions.canManageAuthority();
  }

  /**
   * Check if the authority can use a program
   * @param programId Program Id of the program to check
   * @returns
   */
  canUseProgram(programId: SolanaPublicKey) {
    return this.actions.canUseProgram(programId);
  }

  /**
   * Check if the role can spend any amount of SOL
   * @returns `boolean`
   */
  canSpendSolMax() {
    return this.actions.canSpendSolMax();
  }

  /**
   * Check if the role has the pemission to spend sol at all, or more than the limit if amount is provided
   * @param amount The amount of role should be able to spend
   * @returns `boolean`
   */
  canSpendSol(amount?: bigint) {
    return this.actions.canSpendSol(amount);
  }

  /**
   * Check if the role has the permission to spend any amount of the given token
   * @param mint token mint
   * @returns `boolean`
   */
  canSpendTokenMax(mint: SolanaPublicKey) {
    return this.actions.canSpendTokenMax(mint);
  }

  /**
   * Check if the role has the pemission to spend a given token at all, or more than the limit if amount is provided
   * @param mint token mint
   * @param amount amount the role should be able to spend
   * @returns
   */
  canSpendToken(mint: SolanaPublicKey, amount?: bigint) {
    return this.actions.canSpendToken(mint, amount);
  }

  /**
   * Gets the spend limit for a SOL. Return null if the spend is uncapped.
   * @returns `bigint` | `null`
   */
  solSpendLimit(): bigint | null {
    return this.actions.solSpendLimit();
  }

  /**
   * Get Sol {@link SpendController} for the actions
   * @returns SpendController
   */
  solSpend(): SpendController {
    return this.actions.solSpend();
  }

  /**
   * Gets the spend limit for a given token mint. Return null if the spend is uncapped.
   * @param mint Token mint
   * @returns `bigint` | `null`
   */
  tokenSpendLimit(mint: SolanaPublicKey): bigint | null {
    return this.actions.tokenSpendLimit(mint);
  }

  /**
   * Get Token {@link SpendController} for the actions
   * @param mint Token mint
   * @returns SpendController
   */
  tokenSpend(mint: SolanaPublicKey): SpendController {
    return this.actions.tokenSpend(mint);
  }
}

/**
 * Sign instruction
 * @param role Acting `Role`
 * @param payer Ed22519 payer public key
 * @param innerInstructions Instructions to sign
 * @returns `TransactionInstruction`
 */
export async function signInstruction(
  role: Role,
  payer: SolanaPublicKey,
  innerInstructions: SolInstruction[],
  options?: InstructionDataOptions,
  withSubAccount?: boolean,
) {
  return withSubAccount
    ? role.authority.subAccountSign({
        swigAddress: role.swigAddress,
        subAccount: new SolanaPublicKey(
          (await findSwigSubAccountPda(role.swigId, role.id))[0],
        ),
        payer,
        innerInstructions,
        roleId: role.id,
        options,
      })
    : role.authority.sign({
        swigAddress: role.swigAddress,
        payer,
        innerInstructions,
        roleId: role.id,
        options,
      });
}

/**
 * `AddAuthority` Instruction
 * @param role Acting Swig `Role`
 * @param payer Payer public key
 * @param newAuthorityInfo new {@link CreateAuthorityInfo} to add
 * @param actions `Actions` the authority can perform on behalf of the swig
 * @returns `TransactionInstruction`
 */
export function addAuthorityInstruction(
  role: Role,
  payer: SolanaPublicKey,
  newAuthorityInfo: CreateAuthorityInfo,
  actions: Actions,
  options?: InstructionDataOptions,
) {
  return role.authority.addAuthority({
    payer,
    swigAddress: role.swigAddress,
    actingRoleId: role.id,
    actions,
    newAuthorityInfo,
    options,
  });
}

/**
 * `RemoveAuthority` Instruction
 * @param role Acting Swig `Role`
 * @param payer Payer public key
 * @param roleToRemove Swig `Role` to remove
 * @returns `TransactionInstruction`
 */
export function removeAuthorityInstruction(
  role: Role,
  payer: SolanaPublicKey,
  roleToRemove: Role,
  options?: InstructionDataOptions,
) {
  return role.authority.removeAuthority({
    payer,
    swigAddress: role.swigAddress,
    roleId: role.id,
    roleIdToRemove: roleToRemove.id,
    options,
  });
}

/**
 * `CreateSession` Instruction
 * @param role Acting Swig `Role`
 * @param payer Payer public key
 * @param newSessionKey Public key of the new Session
 * @param sessionDuration Session duration in slots
 * @returns `TransactionInstruction`
 */
export function createSessionInstruction(
  role: Role,
  payer: SolanaPublicKey,
  newSessionKey: SolanaPublicKey,
  sessionDuration?: bigint,
  options?: InstructionDataOptions,
) {
  if (!role.isSessionBased()) return null;
  return role.authority.createSession({
    roleId: role.id,
    swigAddress: role.swigAddress,
    payer,
    sessionDuration,
    newSessionKey,
    options,
  });
}

export function createSubAccountInstruction(
  role: Role,
  payer: SolanaPublicKey,
  options?: InstructionDataOptions,
) {
  return role.authority.subAccountCreate({
    swigAddress: role.swigAddress,
    swigId: role.swigId,
    payer,
    roleId: role.id,
    options,
  });
}

export async function toggleSubAccountInstruction(
  role: Role,
  payer: SolanaPublicKey,
  enabled: boolean,
  options?: InstructionDataOptions,
) {
  return role.authority.subAccountToggle({
    swigAddress: role.swigAddress,
    subAccount: new SolanaPublicKey(
      (await findSwigSubAccountPda(role.swigId, role.id))[0],
    ),
    payer,
    roleId: role.id,
    options,
    enabled,
  });
}

export async function withdrawFromSubAccountInstruction(
  role: Role,
  payer: SolanaPublicKey,
  args:
    | { amount: bigint } // SOL
    | { amount: bigint; mint: SolanaPublicKey; tokenProgram?: SolanaPublicKey }, // SPL Token
  options?: InstructionDataOptions,
) {
  const subAccount = new SolanaPublicKey(
    (await findSwigSubAccountPda(role.swigId, role.id))[0],
  );
  return 'mint' in args
    ? role.authority.subAccountWithdrawToken({
        swigAddress: role.swigAddress,
        subAccount,
        payer,
        roleId: role.id,
        options,
        amount: args.amount,
        mint: args.mint,
        tokenProgram: args.tokenProgram,
      })
    : role.authority.subAccountWithdrawSol({
        swigAddress: role.swigAddress,
        subAccount,
        payer,
        roleId: role.id,
        options,
        amount: args.amount,
      });
}

export function deserializeRoles(
  swigAddress: SolanaPublicKey,
  rolesBuffer: Uint8Array,
  count: number,
  swigId: Uint8Array,
): Role[] {
  let cursor = 0;
  const roles: Role[] = [];

  for (let i = 0; i < count; i++) {
    const positionRaw = rolesBuffer.slice(cursor, cursor + POSITION_LENGTH);
    const position = getPositionDecoder().decode(positionRaw);

    cursor += POSITION_LENGTH;

    const roleData = rolesBuffer.slice(cursor, position.boundary);

    roles.push(Role.from(swigAddress, position, roleData, swigId));

    cursor = position.boundary;
  }

  return roles;
}

export function deserializeRoleData(position: Position, roleData: Uint8Array) {
  const authorityData = roleData.slice(0, position.authorityLen);
  const rawActions = roleData.slice(position.authorityLen);

  const authority = getRoleAuthority(
    position.authorityType,
    authorityData,
    position.id,
  );
  const actions = Actions.from(rawActions, position.numActions);

  return { position, authority, actions };
}

// todo: delete roles recursively!

export type SessionBasedRole = Role & { authority: SessionBasedAuthority };

export type TokenBasedRole = Role & { authority: TokenBasedAuthority };
