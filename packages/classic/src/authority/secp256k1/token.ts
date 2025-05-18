import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { AuthorityType } from '@swig-wallet/coder';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
import { Authority, TokenBasedAuthority } from '../abstract';
import { Secp256k1Instruction } from '../instructions';
import type { InstructionDataOptions } from '../instructions/interface';
import type { Secp256k1BasedAuthority } from './based';

export class Secp256k1Authority
  extends TokenBasedAuthority
  implements Secp256k1BasedAuthority
{
  type = AuthorityType.Secp256k1;

  constructor(
    data: Uint8Array,
    options?:
      | { roleId: number; createData?: undefined }
      | { roleId?: undefined; createData?: Uint8Array },
  ) {
    super(data, options ? (options.roleId ?? null) : null);
  }

  static fromPublicKeyString(pkString: string): Secp256k1Authority {
    let data = hexToBytes(pkString);
    return Secp256k1Authority.fromPublicKeyBytes(data);
  }

  static fromPublicKeyBytes(pkBytes: Uint8Array): Secp256k1Authority {
    return new Secp256k1Authority(pkBytes.slice(1));
  }

  get id() {
    return this.publicKeyBytes;
  }

  get signer() {
    return this.publicKeyBytes;
  }

  get secp256k1PublicKey() {
    return this.publicKeyBytes;
  }

  get secp256k1PublicKeyString() {
    return this.publicKeyString;
  }

  get publicKeyBytes(): Uint8Array {
    return this.isInitialized()
      ? this._initPublicKeyBytes
      : secp256k1.ProjectivePoint.fromHex(
          this._uninitPublicKeyBytes,
        ).toRawBytes(true);
  }

  private get _initPublicKeyBytes() {
    return this.data.slice(0, 33);
  }

  private get _uninitPublicKeyBytes() {
    let bytes = new Uint8Array(65);
    bytes.set([4]);
    bytes.set(this.data, 1);
    return bytes;
  }

  get publicKeyString(): string {
    return bytesToHex(this.publicKeyBytes);
  }

  async createAuthorityData(createData?: Uint8Array) {
    if (!this.createData || createData)
      throw new Error('PublicKey required to add Secp256k1 authority');
    return createData || this.createData;
  }

  async create(args: {
    payer: PublicKey;
    id: Uint8Array;
    actions: Actions;
    authorityRaw?: Uint8Array;
  }) {
    return createSwigInstruction(
      { payer: args.payer },
      {
        authorityData: await this.createAuthorityData(args.authorityRaw),
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
    return Secp256k1Instruction.signV1Instruction(
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

  async addAuthority(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    actingRoleId: number;
    actions: Actions;
    newAuthority: Authority;
    newAuthorityRaw?: Uint8Array;
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.addAuthorityV1Instruction(
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
    return Secp256k1Instruction.removeAuthorityV1Instruction(
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
