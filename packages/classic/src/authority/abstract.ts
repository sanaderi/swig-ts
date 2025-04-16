import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { type AuthorityType } from '@swig/coder';
import { uint8ArraysEqual } from '../utils';
// import { getAuthorityConfig } from './config';
import type { Actions } from '../actions';
import type { AuthorityInstruction } from './interface';

export abstract class Authority {
  abstract instructions: AuthorityInstruction;
  abstract session: boolean;
  abstract type: AuthorityType;

  constructor(public data: Uint8Array) {}

  abstract create(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    bump: number;
    id: Uint8Array;
    actions: Actions;
  }): TransactionInstruction;

  abstract sign(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    roleId: number;
    innerInstructions: TransactionInstruction[];
  }): TransactionInstruction;

  abstract addAuthority(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    actingRoleId: number;
    actions: Actions;
    newAuthority: Authority;
  }): TransactionInstruction;

  abstract removeAuthority(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    roleId: number;
    roleIdToRemove: number;
  }): TransactionInstruction;

  abstract createAuthorityData(): Uint8Array;

  isEqual(other: Authority): boolean {
    return uint8ArraysEqual(this.data, other.data) && this.type === other.type;
  }
}

export abstract class TokenBasedAuthority extends Authority {
  session = false;
}

export abstract class SessionBasedAuthority extends Authority {
  session = true;

  abstract sessionKey: PublicKey;
  abstract expirySlot: bigint;
  abstract maxDuration: bigint;

  abstract createSession(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    roleId: number;
    sessionDuration?: bigint;
    newSessionKey: PublicKey;
  }): TransactionInstruction;
}

export function isTokenBasedAuthority(
  authority: Authority,
): authority is TokenBasedAuthority {
  return authority instanceof TokenBasedAuthority;
}

export function isSessionBasedAuthority(
  authority: Authority,
): authority is SessionBasedAuthority {
  return authority instanceof SessionBasedAuthority;
}
