import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { AuthorityType } from '@swig-wallet/coder';
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

  constructor(
    data: Uint8Array,
    options?:
      | { roleId: number; createData?: undefined }
      | { roleId?: undefined; createData?: Uint8Array },
  ) {
    super(data, options ? (options.roleId ?? null) : null);
  }

  static fromPublicKey(publicKey: PublicKey): Ed25519Authority {
    return new Ed25519Authority(publicKey.toBytes());
  }

  get id() {
    return this.data;
  }

  get signer() {
    return this.data;
  }

  get publicKey() {
    return this.ed25519PublicKey;
  }

  get address() {
    return this.ed25519PublicKey;
  }

  get ed25519PublicKey() {
    return new PublicKey(this.data);
  }

  async createAuthorityData(_?: Uint8Array) {
    return this.data;
  }

  async create(args: { payer: PublicKey; id: Uint8Array; actions: Actions }) {
    return createSwigInstruction(
      { payer: args.payer },
      {
        authorityData: await this.createAuthorityData(),
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
  }) {
    return Ed25519Instruction.signV1Instruction(
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

  async addAuthority(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    actingRoleId: number;
    actions: Actions;
    newAuthority: Authority;
    newAuthorityRaw?: Uint8Array;
  }) {
    return Ed25519Instruction.addAuthorityV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        actingRoleId: args.actingRoleId,
        actions: args.actions.bytes(),
        authorityData: this.data,
        newAuthorityData: await args.newAuthority.createAuthorityData(
          args.newAuthorityRaw,
        ),
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
  }) {
    return Ed25519Instruction.removeAuthorityV1Instruction(
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

export function getEd25519AuthorityFromPublicKey(publicKey: PublicKey) {
  return Ed25519Authority.fromPublicKey(publicKey);
}

export function isEd25519Authority(
  authority: Authority,
): authority is Ed25519Authority {
  return authority instanceof Ed25519Authority;
}
