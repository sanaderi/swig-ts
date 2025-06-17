import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import { address, type Address, type IInstruction } from '@solana/kit';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { AuthorityType } from '@swig-wallet/coder';
import bs58 from 'bs58';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
import {
  compressedPubkeyToAddress,
  findSwigSubAccountPda,
  getUnprefixedSecpBytes,
} from '../../utils';
import { TokenBasedAuthority } from '../abstract';
import type { CreateAuthorityInfo } from '../createAuthority';
import { Secp256k1Instruction } from '../instructions';
import type { InstructionDataOptions } from '../instructions/interface';
import type { Secp256k1BasedAuthority } from './based';

export class Secp256k1Authority
  extends TokenBasedAuthority
  implements Secp256k1BasedAuthority
{
  type = AuthorityType.Secp256k1;

  constructor(data: Uint8Array, roleId?: number) {
    super(data, roleId ?? null);
  }

  static fromPublicKeyString(pkString: string): Secp256k1Authority {
    const data = hexToBytes(pkString);
    return Secp256k1Authority.fromPublicKeyBytes(data);
  }

  static fromPublicKeyBytes(pkBytes: Uint8Array): Secp256k1Authority {
    return new Secp256k1Authority(pkBytes.slice(1));
  }

  static fromPublicKey(pk: string | Uint8Array): Secp256k1Authority {
    const data = getUnprefixedSecpBytes(pk, 64);
    return new Secp256k1Authority(data);
  }

  static fromAddress(addr: Address): Secp256k1Authority {
    return new Secp256k1Authority(bs58.decode(addr));
  }

  get id() {
    return this.secp256k1Address;
  }

  get signer() {
    return this.secp256k1Address;
  }

  get secp256k1Address(): Uint8Array {
    return compressedPubkeyToAddress(this.publicKeyBytes);
  }

  get secp256k1AddressString(): string {
    return `0x${bytesToHex(this.secp256k1Address)}`;
  }

  get secp256k1PublicKey(): Uint8Array {
    return this.publicKeyBytes;
  }

  get secp256k1PublicKeyString(): string {
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
    const bytes = new Uint8Array(65);
    bytes.set([4]);
    bytes.set(this.data, 1);
    return bytes;
  }

  get publicKeyString(): string {
    return bytesToHex(this.publicKeyBytes);
  }

  get address(): Address {
    return address(bs58.encode(this.data));
  }

  createAuthorityData(): Uint8Array {
    return this.data;
  }

  async create(args: {
    payer: Address;
    id: Uint8Array;
    actions: Actions;
  }): Promise<IInstruction> {
    return await createSwigInstruction(
      { payer: args.payer },
      {
        authorityData: this.createAuthorityData(),
        id: args.id,
        actions: args.actions.bytes(),
        authorityType: this.type,
        noOfActions: args.actions.count,
      },
    );
  }

  sign(args: {
    swigAddress: Address;
    payer: Address;
    roleId: number;
    innerInstructions: IInstruction[];
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

  addAuthority(args: {
    swigAddress: Address;
    payer: Address;
    actingRoleId: number;
    actions: Actions;
    newAuthorityInfo: CreateAuthorityInfo;
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
        newAuthorityData: args.newAuthorityInfo.createAuthorityInfo.data,
        newAuthorityType: args.newAuthorityInfo.createAuthorityInfo.type,
        noOfActions: args.actions.count,
      },
      args.options,
    );
  }

  removeAuthority(args: {
    payer: Address;
    swigAddress: Address;
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

  async subAccountCreate(args: {
    payer: Address;
    swigAddress: Address;
    swigId: Uint8Array;
    roleId: number;
    options: InstructionDataOptions;
  }) {
    const [subAccount, bump] = await findSwigSubAccountPda(
      args.swigId,
      args.roleId,
    );
    return Secp256k1Instruction.subAccountCreateV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: address(bs58.encode(Uint8Array.from(subAccount))),
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        bump,
      },
      args.options,
    );
  }

  subAccountSign(args: {
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
    roleId: number;
    innerInstructions: IInstruction[];
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.subAccountSignV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        innerInstructions: args.innerInstructions,
      },
      args.options,
    );
  }

  subAccountToggle(args: {
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
    roleId: number;
    enabled: boolean;
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.subAccountToggleV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        enabled: args.enabled,
      },
      args.options,
    );
  }

  subAccountWithdrawSol(args: {
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
    roleId: number;
    amount: bigint;
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.subAccountWithdrawV1SolInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        amount: args.amount,
      },
      args.options,
    );
  }

  subAccountWithdrawToken(args: {
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
    roleId: number;
    mint: Address;
    amount: bigint;
    tokenProgram?: Address;
    options: InstructionDataOptions;
  }) {
    const swigToken = getAssociatedTokenAddressSync(
      new PublicKey(args.mint),
      new PublicKey(args.swigAddress),
      true,
      args.tokenProgram ? new PublicKey(args.tokenProgram) : undefined,
    );
    const subAccountToken = getAssociatedTokenAddressSync(
      new PublicKey(args.mint),
      new PublicKey(args.subAccount),
      true,
      args.tokenProgram ? new PublicKey(args.tokenProgram) : undefined,
    );

    return Secp256k1Instruction.subAccountWithdrawV1TokenInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
        subAccountToken: address(bs58.encode(subAccountToken.toBytes())),
        swigToken: address(bs58.encode(swigToken.toBytes())),
        tokenProgram:
          args.tokenProgram ?? address(bs58.encode(TOKEN_PROGRAM_ID.toBytes())),
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        amount: args.amount,
      },
      args.options,
    );
  }
}
