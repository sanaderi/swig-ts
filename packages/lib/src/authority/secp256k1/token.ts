import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { AuthorityType } from '@swig-wallet/coder';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
import { SolanaPublicKey, SolInstruction } from '../../schema';
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

  constructor(data: Uint8Array) {
    super(data);
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

  get id() {
    return this.secp256k1Address;
  }

  get signer() {
    return this.secp256k1Address;
  }

  get secp256k1Address() {
    return compressedPubkeyToAddress(this.publicKeyBytes);
  }

  get secp256k1AddressString(): string {
    return `Ox${bytesToHex(this.secp256k1Address)}`;
  }

  get secp256k1PublicKey() {
    return this.publicKeyBytes;
  }

  get secp256k1PublicKeyString() {
    return this.publicKeyString;
  }

  get publicKeyBytes(): Uint8Array {
    return this._initPublicKeyBytes;
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

  odometer(): number {
    // const bytes = this.data.slice(36)
    const view = new DataView(this.data.buffer);
    return view.getUint32(36, true) + 1;
  }

  createAuthorityData(): Uint8Array {
    return this.publicKeyBytes;
  }

  create(args: { payer: SolanaPublicKey; id: Uint8Array; actions: Actions }) {
    return createSwigInstruction(
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
    swigAddress: SolanaPublicKey;
    payer: SolanaPublicKey;
    roleId: number;
    innerInstructions: SolInstruction[];
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.signV1Instruction(
      {
        swig: args.swigAddress,
        payer: args.payer,
      },
      {
        authorityData: this.publicKeyBytes,
        innerInstructions: args.innerInstructions,
        roleId: args.roleId,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  addAuthority(args: {
    swigAddress: SolanaPublicKey;
    payer: SolanaPublicKey;
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
        authorityData: this.publicKeyBytes,
        newAuthorityData: args.newAuthorityInfo.createAuthorityInfo.data,
        newAuthorityType: args.newAuthorityInfo.createAuthorityInfo.type,
        noOfActions: args.actions.count,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  removeAuthority(args: {
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
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
        authorityData: this.publicKeyBytes,
        authorityToRemoveId: args.roleIdToRemove,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  async subAccountCreate(args: {
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
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
        subAccount: new SolanaPublicKey(subAccount),
      },
      {
        roleId: args.roleId,
        authorityData: this.publicKeyBytes,
        bump,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  subAccountSign(args: {
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
    subAccount: SolanaPublicKey;
    roleId: number;
    innerInstructions: SolInstruction[];
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
        authorityData: this.publicKeyBytes,
        innerInstructions: args.innerInstructions,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  subAccountToggle(args: {
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
    subAccount: SolanaPublicKey;
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
        authorityData: this.publicKeyBytes,
        enabled: args.enabled,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  subAccountWithdrawSol(args: {
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
    subAccount: SolanaPublicKey;
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
        authorityData: this.publicKeyBytes,
        amount: args.amount,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  async subAccountWithdrawToken(args: {
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
    subAccount: SolanaPublicKey;
    roleId: number;
    mint: SolanaPublicKey;
    amount: bigint;
    tokenProgram?: SolanaPublicKey;
    options: InstructionDataOptions;
  }) {
    const [swigToken] = await findAssociatedTokenPda({
      mint: args.mint.toAddress(),
      owner: args.swigAddress.toAddress(),
      tokenProgram: args.tokenProgram?.toAddress() ?? TOKEN_PROGRAM_ADDRESS,
    });

    const [subAccountToken] = await findAssociatedTokenPda({
      mint: args.mint.toAddress(),
      owner: args.subAccount.toAddress(),
      tokenProgram: args.tokenProgram?.toAddress() ?? TOKEN_PROGRAM_ADDRESS,
    });
    return Secp256k1Instruction.subAccountWithdrawV1TokenInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
        subAccountToken: new SolanaPublicKey(subAccountToken),
        swigToken: new SolanaPublicKey(swigToken),
        tokenProgram:
          args.tokenProgram ?? new SolanaPublicKey(TOKEN_PROGRAM_ADDRESS),
      },
      {
        roleId: args.roleId,
        authorityData: this.publicKeyBytes,
        amount: args.amount,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }
}
