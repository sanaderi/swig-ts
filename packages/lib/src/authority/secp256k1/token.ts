import { bytesToHex } from '@noble/curves/abstract/utils';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { AuthorityType } from '@swig-wallet/coder';
import type { Actions } from '../../actions';
import { SolanaPublicKey, SolInstruction, type SolanaPublicKeyData } from '../../schema';
import { compressedPubkeyToAddress, findSwigSubAccountPda } from '../../utils';
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

  get publicKeyString(): string {
    return bytesToHex(this.publicKeyBytes);
  }

  odometer(): number {
    const view = new DataView(this.data.buffer);
    return view.getUint32(36, true) + 1;
  }

  sign(args: {
    swigAddress: SolanaPublicKeyData;
    payer: SolanaPublicKeyData;
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
    swigAddress: SolanaPublicKeyData;
    payer: SolanaPublicKeyData;
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
        newAuthorityData: args.newAuthorityInfo.data,
        newAuthorityType: args.newAuthorityInfo.type,
        noOfActions: args.actions.count,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  removeAuthority(args: {
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
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
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
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
        subAccount,
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
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    subAccount: SolanaPublicKeyData;
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
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    subAccount: SolanaPublicKeyData;
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
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    subAccount: SolanaPublicKeyData;
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
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    subAccount: SolanaPublicKeyData;
    roleId: number;
    mint: SolanaPublicKeyData;
    amount: bigint;
    tokenProgram?: SolanaPublicKeyData;
    options: InstructionDataOptions;
  }) {
    const mint = new SolanaPublicKey(args.mint).toAddress();
    const swigAddress = new SolanaPublicKey(args.swigAddress).toAddress();
    const subAccount = new SolanaPublicKey(args.subAccount).toAddress();
    const tokenProgram =
      new SolanaPublicKey(args.subAccount).toAddress() ?? TOKEN_PROGRAM_ADDRESS;

    const [swigToken] = await findAssociatedTokenPda({
      mint,
      owner: swigAddress,
      tokenProgram,
    });

    const [subAccountToken] = await findAssociatedTokenPda({
      mint,
      owner: subAccount,
      tokenProgram,
    });

    return Secp256k1Instruction.subAccountWithdrawV1TokenInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
        subAccountToken,
        swigToken,
        tokenProgram,
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
