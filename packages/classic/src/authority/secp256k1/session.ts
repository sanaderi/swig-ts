import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { AuthorityType, getSecp256k1SessionDecoder } from '@swig/coder';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
import { Authority, SessionBasedAuthority } from '../abstract';
import { Secp256k1Instruction } from '../instructions';
import type { InstructionDataOptions } from '../instructions/interface';

export class Secp256k1SessionAuthority extends SessionBasedAuthority {
  type = AuthorityType.Secp256k1Session;
  instructions = Secp256k1Instruction;

  constructor(data: Uint8Array) {
    super(data);
  }

  static fromPublicKeyString(pkString: string): Secp256k1SessionAuthority {
    let data = Uint8Array.from(Buffer.from(pkString.slice(2), 'hex'));
    return new Secp256k1SessionAuthority(data);
  }

  static fromPublicKeyBytes(pkBytes: Uint8Array): Secp256k1SessionAuthority {
    return new Secp256k1SessionAuthority(pkBytes);
  }

  get publicKeyString(): string {
    return Buffer.from(this.data).toString('hex');
  }

  get sessionKey(): PublicKey {
    return new PublicKey(this.data.slice(64, 96));
  }

  get expirySlot() {
    return this.info.currentSessionExpiration;
  }

  get maxDuration() {
    return this.info.maxSessionLength;
  }

  private get info(): SessionData {
    let data = getSecp256k1SessionDecoder().decode(this.data);
    return {
      ...data,
      publicKey: Uint8Array.from(data.publicKey),
      sessionKey: new PublicKey(data.publicKey),
    };
  }

  createAuthorityData(): Uint8Array {
    return this.data;
  }

  create(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    bump: number;
    id: Uint8Array;
    actions: Actions;
  }) {
    return createSwigInstruction(
      { payer: args.payer, swig: args.swigAddress },
      {
        bump: args.bump,
        authorityData: this.data,
        id: args.id,
        actions: args.actions.bytes(),
        authorityType: this.type,
        noOfActions: args.actions.count,
      },
    );
  }

  sign(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    roleId: number;
    innerInstructions: TransactionInstruction[];
    options: InstructionDataOptions;
  }) {
    return this.instructions.signV1Instruction(
      {
        swig: args.swigAddress,
        payer: args.payer,
      },
      {
        authorityData: this.data,
        innerInstructions: args.innerInstructions,
        roleId: args.roleId,
      },
      args.options,
    );
  }

  addAuthority(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    actingRoleId: number;
    actions: Actions;
    newAuthority: Authority;
    options: InstructionDataOptions;
  }) {
    return this.instructions.addAuthorityV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        actingRoleId: args.actingRoleId,
        actions: args.actions.bytes(),
        authorityData: this.data,
        newAuthorityData: args.newAuthority.data,
        newAuthorityType: args.newAuthority.type,
        noOfActions: args.actions.count,
      },
      args.options,
    );
  }

  removeAuthority(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    roleId: number;
    roleIdToRemove: number;
    options: InstructionDataOptions;
  }) {
    return this.instructions.removeAuthorityV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        actingRoleId: args.roleId,
        authorityData: this.data,
        authorityToRemoveId: args.roleIdToRemove,
      },
      args.options,
    );
  }

  createSession(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    newSessionKey: PublicKey;
    roleId: number;
    sessionDuration?: bigint;
    options: InstructionDataOptions;
  }) {
    return this.instructions.createSessionV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        authorityData: this.data,
        roleId: args.roleId,
        sessionDuration: args.sessionDuration ?? this.maxDuration,
        sessionKey: args.newSessionKey.toBytes(),
      },
      args.options,
    );
  }
}

export type SessionData = {
  publicKey: Uint8Array;
  sessionKey: PublicKey;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};
