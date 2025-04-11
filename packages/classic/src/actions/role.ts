import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getPositionDecoder,
  POSITION_LENGTH,
  type Position,
} from '@swig/coder';
import {
  Authority,
  getAuthority,
  SessionBasedAuthority,
  TokenBasedAuthority,
} from '../authority';
import { Actions } from './action';

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

  get id() {
    return this.position.id;
  }

  isSessionBased(): this is Role & { authority: SessionBasedAuthority } {
    return this.authority instanceof SessionBasedAuthority;
  }

  isTokenBased(): this is Role & { authority: TokenBasedAuthority } {
    return this.authority instanceof TokenBasedAuthority;
  }

  hasAllAction() {
    return this.actions.hasAllAction();
  }

  canManageAuthority() {
    return this.actions.canManageAuthority();
  }

  canUseProgram(programId: PublicKey) {
    return this.actions.canUseProgram(programId);
  }

  canSpendSolMax() {
    return this.actions.canSpendSolMax();
  }

  canSpendSol(amount?: bigint) {
    return this.actions.canSpendSol(amount);
  }

  canSpendTokenMax(mint: PublicKey) {
    return this.actions.canSpendTokenMax(mint);
  }

  canSpendToken(mint: PublicKey, amount?: bigint) {
    return this.actions.canSpendToken(mint, amount);
  }

  sign(args: {
    payer: PublicKey;
    innerInstructions: TransactionInstruction[];
  }) {
    return this.authority.sign({
      swigAddress: this.swigAddress,
      payer: args.payer,
      innerInstructions: args.innerInstructions,
      roleId: this.id,
    });
  }

  addAuthority(args: {
    payer: PublicKey;
    actions: Actions;
    newAuthority: Authority;
  }) {
    return this.authority.addAuthority({
      payer: args.payer,
      swigAddress: this.swigAddress,
      actingRoleId: this.id,
      actions: args.actions,
      newAuthority: args.newAuthority,
    });
  }

  removeAuthority(args: { payer: PublicKey; roleToRemove: Role }) {
    return this.authority.removeAuthority({
      payer: args.payer,
      swigAddress: this.swigAddress,
      roleId: this.id,
      roleIdToRemove: args.roleToRemove.id,
    });
  }

  createSession(args: {
    payer: PublicKey;
    newSessionKey: PublicKey;
    sessionDuration?: bigint;
  }) {
    if (!this.isSessionBased()) return null;
    return this.authority.createSession({
      roleId: this.id,
      swigAddress: this.swigAddress,
      payer: args.payer,
      sessionDuration: args.sessionDuration,
      newSessionKey: args.newSessionKey,
    });
  }
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

export function isSessionBased(
  role: Role,
): role is Role & { authority: SessionBasedAuthority } {
  return role.authority instanceof SessionBasedAuthority;
}
