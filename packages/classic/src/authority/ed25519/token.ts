import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { AuthorityType } from '@swig/coder';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
import { Authority, TokenBasedAuthority } from '../abstract';
import { Ed25519Instruction } from '../instructions';
import type { Ed25519BasedAuthority } from './based';

export class Ed25519Authority
  extends TokenBasedAuthority
  implements Ed25519BasedAuthority
{
  type = AuthorityType.Ed25519;
  instructions = Ed25519Instruction;

  constructor(public address: PublicKey) {
    let bytes = address.toBytes();
    super(bytes);
  }

  static fromBytes(bytes: Uint8Array): Ed25519Authority {
    return new Ed25519Authority(new PublicKey(bytes));
  }

  createAuthorityData() {
    return this.data;
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
        authorityData: this.createAuthorityData(),
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
        newAuthorityData: args.newAuthority.createAuthorityData(),
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

export function isEd25519Authority(
  authority: Authority,
): authority is Ed25519Authority {
  return authority instanceof Ed25519Authority;
}
