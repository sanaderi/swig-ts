import { bytesToHex } from '@noble/curves/abstract/utils';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import {
  AuthorityType,
  getSecp256k1SessionDecoder,
  type Secp256k1SessionAuthorityDataArgs,
} from '@swig-wallet/coder';
import type { Actions } from '../../actions';
import {
  SolanaPublicKey,
  SolInstruction,
  type SolanaPublicKeyData,
} from '../../schema';
import { compressedPubkeyToAddress, findSwigSubAccountPda } from '../../utils';
import { SessionBasedAuthority } from '../abstract';
import type { CreateAuthorityInfo } from '../createAuthority';
import { Ed25519Instruction, Secp256k1Instruction } from '../instructions';
import type { InstructionDataOptions } from '../instructions/interface';
import type { Secp256k1BasedAuthority } from './based';

export class Secp256k1SessionAuthority
  extends SessionBasedAuthority
  implements Secp256k1BasedAuthority
{
  type = AuthorityType.Secp256k1Session;

  constructor(data: Uint8Array) {
    super(data);
  }

  get id() {
    return this.secp256k1Address;
  }

  get signer() {
    return this.sessionKey.toBytes();
  }

  get publicKeyBytes(): Uint8Array {
    return this.info.publicKey;
  }

  get publicKeyString(): string {
    return bytesToHex(this.publicKeyBytes);
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

  get sessionKey(): SolanaPublicKey {
    return this.info.sessionKey;
  }

  get expirySlot() {
    return this.info.currentSessionExpiration;
  }

  get maxDuration() {
    return this.info.maxSessionLength;
  }

  odometer() {
    return this.info.odometer + 1;
  }

  private get info(): SessionData {
    const data: Secp256k1SessionAuthorityDataArgs =
      getSecp256k1SessionDecoder().decode(this.data);

    return {
      ...data,
      publicKey: Uint8Array.from(data.publicKey),
      sessionKey: new SolanaPublicKey(new Uint8Array(data.sessionKey)),
    };
  }

  sign(args: {
    swigAddress: SolanaPublicKeyData;
    payer: SolanaPublicKeyData;
    roleId: number;
    innerInstructions: SolInstruction[];
  }) {
    return Ed25519Instruction.signV1Instruction(
      {
        swig: args.swigAddress,
        payer: args.payer,
      },
      {
        authorityData: this.sessionKey.toBytes(),
        innerInstructions: args.innerInstructions,
        roleId: args.roleId,
      },
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
        authorityData: this.data,
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
        authorityData: this.data,
        authorityToRemoveId: args.roleIdToRemove,
      },
      { ...args.options, odometer: this.odometer() ?? args.options.odometer },
    );
  }

  createSession(args: {
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    newSessionKey: SolanaPublicKeyData;
    roleId: number;
    sessionDuration?: bigint;
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.createSessionV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        authorityData: this.data,
        roleId: args.roleId,
        sessionDuration: args.sessionDuration ?? this.maxDuration,
        sessionKey: new SolanaPublicKey(args.newSessionKey).toBytes(),
      },
      { ...args.options, odometer: this.odometer() ?? args.options?.odometer },
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
        subAccount: new SolanaPublicKey(subAccount),
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
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
  }) {
    return Ed25519Instruction.subAccountSignV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
      },
      {
        roleId: args.roleId,
        authorityData: this.sessionKey.toBytes(),
        innerInstructions: args.innerInstructions,
      },
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
        authorityData: this.data,
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
        authorityData: this.data,
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

type SessionData = {
  publicKey: Uint8Array;
  sessionKey: SolanaPublicKey;
  odometer: number;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};
