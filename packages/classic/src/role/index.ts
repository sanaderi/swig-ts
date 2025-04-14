import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getPositionDecoder,
  POSITION_LENGTH,
  type Position,
} from '@swig/coder';
import { Actions } from '../actions';
import {
  getAuthority,
  SessionBasedAuthority,
  TokenBasedAuthority,
  type Authority,
} from '../authority';

export class Role {
  private constructor(
    public readonly swigAddress: PublicKey,
    private readonly position: Position,
    public readonly authority: Authority,
    private readonly actions: Actions,
  ) {}

  static from(
    swigAddress: PublicKey,
    position: Position,
    roleData: Uint8Array,
  ) {
    let { actions, authority } = deserializeRoleData(position, roleData);
    return new Role(swigAddress, position, authority, actions);
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
   * Check if the role has all permissions enabled
   * @returns `boolean`
   */
  hasAllAction() {
    return this.actions.hasAllAction();
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
  canUseProgram(programId: PublicKey) {
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
  canSpendTokenMax(mint: PublicKey) {
    return this.actions.canSpendTokenMax(mint);
  }

  /**
   * Check if the role has the pemission to spend a given token at all, or more than the limit if amount is provided
   * @param mint token mint
   * @param amount amount the role should be able to spend
   * @returns
   */
  canSpendToken(mint: PublicKey, amount?: bigint) {
    return this.actions.canSpendToken(mint, amount);
  }
}

/**
 * Sign instruction
 * @param role Acting `Role`
 * @param payer Ed22519 payer public key
 * @param innerInstructions Instructions to sign
 * @returns `TransactionInstruction`
 */
export function signInstruction(
  role: Role,
  payer: PublicKey,
  innerInstructions: TransactionInstruction[],
) {
  return role.authority.sign({
    swigAddress: role.swigAddress,
    payer,
    innerInstructions,
    roleId: role.id,
  });
}

/**
 * `AddAuthority` Instruction
 * @param role Acting Swig `Role`
 * @param payer Payer public key
 * @param newAuthority Swig `Authority` to add to the swig
 * @param actions `Actions` the authority can perform on behalf of the swig
 * @returns `TransactionInstruction`
 */
export function addAuthorityInstruction(
  role: Role,
  payer: PublicKey,
  newAuthority: Authority,
  actions: Actions,
) {
  return role.authority.addAuthority({
    payer,
    swigAddress: role.swigAddress,
    actingRoleId: role.id,
    actions,
    newAuthority,
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
  payer: PublicKey,
  roleToRemove: Role,
) {
  return role.authority.removeAuthority({
    payer,
    swigAddress: role.swigAddress,
    roleId: role.id,
    roleIdToRemove: roleToRemove.id,
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
  payer: PublicKey,
  newSessionKey: PublicKey,
  sessionDuration?: bigint,
) {
  if (!role.isSessionBased()) return null;
  return role.authority.createSession({
    roleId: role.id,
    swigAddress: role.swigAddress,
    payer,
    sessionDuration,
    newSessionKey,
  });
}

export function deserializeRoles(
  swigAddress: PublicKey,
  rolesBuffer: Uint8Array,
  count: number,
): Role[] {
  let cursor = 0;
  let roles: Role[] = [];

  for (let i = 0; i < count; i++) {
    let positionRaw = rolesBuffer.slice(cursor, cursor + POSITION_LENGTH);
    let position = getPositionDecoder().decode(positionRaw);

    cursor += POSITION_LENGTH;

    let roleData = rolesBuffer.slice(cursor, position.boundary);

    roles.push(Role.from(swigAddress, position, roleData));

    cursor = position.boundary;
  }

  return roles;
}

export function deserializeRoleData(position: Position, roleData: Uint8Array) {
  let authorityData = roleData.slice(0, position.authorityLen);
  let rawActions = roleData.slice(position.authorityLen);

  let authority = getAuthority(position.authorityType, authorityData);
  let actions = Actions.from(rawActions, position.numActions);

  return { position, authority, actions };
}

export type SessionBasedRole = Role & { authority: SessionBasedAuthority };

export type TokenBasedRole = Role & { authority: TokenBasedAuthority };
