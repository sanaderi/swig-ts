import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getPositionDecoder,
  POSITION_LENGTH,
  type Position,
} from '@swig/coder';
import { Authority, getAuthority } from '../authority';
import { Actions } from './action';

export class Role {
  private constructor(
    public readonly swigAddress: PublicKey,
    private readonly position: Position,
    public readonly authority: Authority,
    private readonly actions: Actions,
  ) {}

  static from(swigAddress: PublicKey, position: Position, roleData: Uint8Array) {
    let { actions, authority } = deserializeRoleData(position, roleData);
    return new Role(swigAddress, position, authority, actions);
  }

  get authorityType() {
    return this.position.authorityType;
  }

  get id() {
    return this.position.id;
  }

  // get authority() {
  //   return getAuthority(this.authorityType, this.authorityData);
  // }

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

  // replaceAuthority(args: {
  //   payer: PublicKey;
  //   actions: Actions;
  //   newAuthority: Authority;
  //   startSlot: bigint;
  //   endSlot: bigint;
  //   roleToReplace: Role;
  // }) {
  //   return this.authority.replaceAuthority({
  //     payer: args.payer,
  //     swigAddress: this.swigAddress,
  //     roleId: this.id,
  //     actions: args.actions,
  //     roleIdToReplace: args.roleToReplace.id,
  //     endSlot: args.endSlot,
  //     startSlot: args.startSlot,
  //     newAuthority: args.newAuthority,
  //   });
  // }
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
  };

  return roles;
}

export function deserializeRoleData(position: Position, roleData: Uint8Array) {
  let authorityData = roleData.slice(0, position.authorityLen);
  let rawActions = roleData.slice(position.authorityLen);

  let authority = getAuthority(position.authorityType, authorityData);
  let actions = Actions.from(rawActions, position.numActions);

  return { position, authority, actions };
}
