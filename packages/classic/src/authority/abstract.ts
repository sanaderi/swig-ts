import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { AuthorityType, type Action } from '@swig/coder';
import { createSwigInstruction } from '../instructions';
import { uint8ArraysEqual } from '../utils';
import { getAuthorityConfig } from './config';

export class Authority {
  constructor(
    public data: Uint8Array,
    public type: AuthorityType,
  ) {}

  get config() {
    return getAuthorityConfig(this.type);
  }

  get instructions() {
    return this.config.instructions;
  }

  static ed25519(address: PublicKey) {
    return new Authority(address.toBytes(), AuthorityType.Ed25519)
  }
  
  static ed25519Session(address: PublicKey) {
    return new Authority(address.toBytes(), AuthorityType.Ed25519Session)
  }
  
  static secp256k1(address: any) {
    return new Authority(address.toBytes(), AuthorityType.Secp256k1)
  }
  
  // static secp256k1Session(address: any) {
  //   return new Authority(address.toBytes(), AuthorityType.Secp256k1Session)
  // }

  create(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    bump: number;
    id: Uint8Array;
    startSlot: bigint;
    endSlot: bigint;
  }) {
    return createSwigInstruction(
      { payer: args.payer, swig: args.swigAddress },
      {
        bump: args.bump,
        authorityData: this.data,
        endSlot: args.endSlot,
        startSlot: args.startSlot,
        id: args.id,
        initialAuthority: this.type,
      },
    );
  }

  sign(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    roleId: number;
    innerInstructions: TransactionInstruction[];
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
    );
  }

  addAuthority(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    actingRoleId: number;
    actions: Action[];
    newAuthority: Authority;
    startSlot: bigint;
    endSlot: bigint;
  }) {
    return this.instructions.addAuthorityV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        actingRoleId: args.actingRoleId,
        actions: args.actions,
        authorityData: this.data,
        startSlot: args.startSlot,
        endSlot: args.endSlot,
        newAuthorityData: args.newAuthority.data,
        newAuthorityType: args.newAuthority.type,
      },
    );
  }

  removeAuthority(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    roleId: number;
    roleIdToRemove: number;
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
    );
  }

  replaceAuthority(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    roleId: number;
    actions: Action[];
    newAuthority: Authority;
    startSlot: bigint;
    endSlot: bigint;
    roleIdToReplace: number;
  }) {
    return this.instructions.replaceAuthorityV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        actingRoleId: args.roleId,
        actions: args.actions,
        authorityData: this.data,
        authorityToReplaceId: args.roleIdToReplace,
        endSlot: args.endSlot,
        startSlot: args.startSlot,
        newAuthorityData: args.newAuthority.data,
        newAuthorityType: args.newAuthority.type,
      },
    );
  }

  isEqual(other: Authority): boolean {
    return uint8ArraysEqual(this.data, other.data) && this.type === other.type;
  }
}
