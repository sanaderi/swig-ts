import type { PublicKey } from '@solana/web3.js';
import {
  getPositionDecoder,
  POSITION_LENGTH,
  type Position,
} from '@swig/coder';
import { Authority, isEd25519Authority } from '../authority';
import { Actions } from './action';

export class Role {
  private constructor(
    private readonly position: Position,
    public readonly authorityData: Uint8Array,
    private readonly actions: Actions,
  ) {}

  static from(position: Position, roleData: Uint8Array) {
    let { actions, authorityData } = deserializeRoleData(position, roleData);
    return new Role(position, authorityData, actions);
  }

  get authorityType() {
    return this.position.authorityType;
  }

  get id() {
    return this.position.id;
  }

  get authority() {
    return new Authority(this.authorityData, this.authorityType);
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
}

export function deserializeRoles(
  rolesBuffer: Uint8Array,
  count: number,
): Role[] {
  let cursor = 0;
  let roles: Role[] = [];

  Array(count).forEach(function (_) {
    let positionRaw = rolesBuffer.slice(cursor, cursor + POSITION_LENGTH);
    let position = getPositionDecoder().decode(positionRaw);

    cursor += POSITION_LENGTH;

    let roleData = rolesBuffer.slice(cursor, position.boundary);

    roles.push(Role.from(position, roleData));

    cursor = position.boundary;
  });

  return roles;
}

export function deserializeRoleData(position: Position, roleData: Uint8Array) {
  let authorityData = roleData.slice(0, position.authorityLen);
  let rawActions = roleData.slice(position.authorityLen);

  let actions = Actions.from(rawActions, position.numActions);

  return { actions, position, authorityData };
}
