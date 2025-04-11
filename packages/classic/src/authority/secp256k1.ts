import { AuthorityType } from '@swig/coder';
import { Authority, TokenBasedAuthority } from './abstract';
import { Secp256k1Instruction } from './instructions';
import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Actions } from '../actions';
import { createSwigInstruction } from '../instructions';

export class Secp256k1Authority extends TokenBasedAuthority {
  type = AuthorityType.Secp256k1;
  instructions = Secp256k1Instruction;

  constructor(public data: any) {
    super(data);
  }

  static fromBytes(bytes: Uint8Array): Secp256k1Authority {
    return new Secp256k1Authority(bytes);
  }

  create(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    bump: number;
    id: Uint8Array;
    actions: Actions;
  }): TransactionInstruction {
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
  }): TransactionInstruction {
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
    actions: Actions;
    newAuthority: Authority;
  }): TransactionInstruction {
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
    );
  }

  removeAuthority(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    roleId: number;
    roleIdToRemove: number;
  }): TransactionInstruction {
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
}
