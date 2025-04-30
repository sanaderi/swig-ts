import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { type AuthorityType } from '@swig/coder';
import type { Actions } from '../actions';
import { uint8ArraysEqual } from '../utils';
import type { InstructionDataOptions } from './instructions/interface';

export abstract class Authority {
  abstract session: boolean;
  abstract type: AuthorityType;
  abstract id: Uint8Array;
  abstract signer: Uint8Array;

  constructor(
    public data: Uint8Array,
    public roleId: number | null,
  ) {}

  isInitialized() {
    return this.roleId !== null;
  }

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
    options?: InstructionDataOptions;
  }): Promise<TransactionInstruction>;

  abstract addAuthority(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    actingRoleId: number;
    actions: Actions;
    newAuthority: Authority;
    options?: InstructionDataOptions;
  }): Promise<TransactionInstruction>;

  abstract removeAuthority(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    roleId: number;
    roleIdToRemove: number;
    options?: InstructionDataOptions;
  }): Promise<TransactionInstruction>;

  abstract createAuthorityData(): Uint8Array;

  isEqual(other: Authority): boolean {
    return uint8ArraysEqual(this.id, other.id) && this.type === other.type;
  }

  matchesSigner(signer: Uint8Array): boolean {
    return uint8ArraysEqual(this.signer, signer);
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
    options?: InstructionDataOptions;
  }): Promise<TransactionInstruction>;
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
