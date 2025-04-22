import * as secp from '@noble/secp256k1';
import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { AuthorityType } from '@swig/coder';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
import { Authority, TokenBasedAuthority } from '../abstract';
import { Secp256k1Instruction } from '../instructions';
import type { InstructionDataOptions } from '../instructions/interface';

export class Secp256k1Authority extends TokenBasedAuthority {
  type = AuthorityType.Secp256k1;
  instructions = Secp256k1Instruction;

  constructor(data: Uint8Array, roleId?: number) {
    super(data, roleId ?? null);
  }

  static fromPublicKeyString(pkString: string): Secp256k1Authority {
    let data = secp.etc.hexToBytes(pkString);
    return Secp256k1Authority.fromPublicKeyBytes(data);
  }

  static fromPublicKeyBytes(pkBytes: Uint8Array): Secp256k1Authority {
    return new Secp256k1Authority(pkBytes.slice(1));
  }

  get publicKeyBytes(): Uint8Array {
    return this.isInitialized()
      ? this.data
      : secp.ProjectivePoint.fromHex(this._uninitPublicKeyBytes).toRawBytes(
          true,
        );
  }

  private get _uninitPublicKeyBytes() {
    let bytes = new Uint8Array(65);
    bytes.set([4]);
    bytes.set(this.data, 1);
    return bytes;
  }

  get publicKeyString(): string {
    return secp.etc.bytesToHex(this.publicKeyBytes);
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
}
