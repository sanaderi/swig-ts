import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import { address, type Address, type IInstruction } from '@solana/kit';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  AuthorityType,
  getCreateSecp256k1SessionDecoder,
  getCreateSecp256k1SessionEncoder,
  getSecp256k1SessionDecoder,
  type Secp256k1SessionAuthorityDataArgs,
} from '@swig-wallet/coder';
import bs58 from 'bs58';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
import {
  compressedPubkeyToAddress,
  findSwigSubAccountPda,
  getUnprefixedSecpBytes,
} from '../../utils';
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

  constructor(data: Uint8Array, roleId?: number) {
    super(data, roleId ?? null);
  }

  get id() {
    return this.secp256k1Address;
  }

  get signer(): Uint8Array {
    return this.sessionKeyBytes;
  }

  get publicKeyBytes(): Uint8Array {
    return this.isInitialized()
      ? this.info.publicKey
      : secp256k1.ProjectivePoint.fromHex(
          this._uninitPublicKeyBytes,
        ).toRawBytes(true);
  }

  get publicKeyString(): string {
    return bytesToHex(this.publicKeyBytes);
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

  get sessionKey(): Address {
    return address(bs58.encode(this.sessionKeyBytes));
  }

  get sessionKeyBytes(): Uint8Array {
    return this.info.sessionKey;
  }

  get expirySlot() {
    return this.info.currentSessionExpiration;
  }

  get maxDuration() {
    return this.info.maxSessionLength;
  }

  private get _uninitPublicKeyBytes() {
    const bytes = new Uint8Array(65);
    bytes.set([4]);
    bytes.set(this.info.publicKey, 1);
    return bytes;
  }

  private get info(): SessionData {
    const data: Secp256k1SessionAuthorityDataArgs = this.isInitialized()
      ? getSecp256k1SessionDecoder().decode(this.data)
      : {
          ...getCreateSecp256k1SessionDecoder().decode(this.data),
          currentSessionExpiration: 0n,
        };
    return {
      ...data,
      publicKey: Uint8Array.from(data.publicKey),
      sessionKey: Uint8Array.from(data.sessionKey),
    };
  }

  static uninitializedString(
    publicKey: string,
    maxSessionDuration: bigint,
    sessionKey?: Address,
  ): Secp256k1SessionAuthority {
    const bytes = hexToBytes(publicKey);
    return Secp256k1SessionAuthority.uninitialized(
      bytes,
      maxSessionDuration,
      sessionKey,
    );
  }

  static uninitialized(
    publicKey: string | Uint8Array,
    maxSessionDuration: bigint,
    sessionKey?: Address,
  ): Secp256k1SessionAuthority {
    const sessionKeyBytes = sessionKey
      ? bs58.decode(sessionKey)
      : new Uint8Array(32);

    const sessionData = getCreateSecp256k1SessionEncoder().encode({
      publicKey:
        typeof publicKey === 'string'
          ? getUnprefixedSecpBytes(publicKey, 64)
          : publicKey,
      sessionKey: sessionKeyBytes,
      maxSessionLength: maxSessionDuration,
    });

    return new this(Uint8Array.from(sessionData));
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
  }) {
    return Ed25519Instruction.signV1Instruction(
      {
        swig: args.swigAddress,
        payer: args.payer,
      },
      {
        authorityData: this.sessionKeyBytes,
        innerInstructions: args.innerInstructions as IInstruction[],
        roleId: args.roleId,
      },
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
    const subAccountAddress =
      typeof subAccount === 'string'
        ? address(subAccount)
        : address(bs58.encode(subAccount));

    return Secp256k1Instruction.subAccountCreateV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: subAccountAddress,
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
  }) {
    return Ed25519Instruction.subAccountSignV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
      },
      {
        roleId: args.roleId,
        authorityData: this.sessionKeyBytes,
        innerInstructions: args.innerInstructions as IInstruction[],
      },
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
    const tokenProgramAddress =
      args.tokenProgram ?? address(bs58.encode(TOKEN_PROGRAM_ID.toBytes()));

    return Secp256k1Instruction.subAccountWithdrawV1TokenInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
        subAccountToken: args.subAccount,
        swigToken: args.swigAddress,
        tokenProgram: tokenProgramAddress,
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        amount: args.amount,
      },
      args.options,
    );
  }

  async createSession(args: {
    payer: Address;
    swigAddress: Address;
    roleId: number;
    newSessionKey: Address;
    sessionDuration?: bigint;
    options: InstructionDataOptions;
  }): Promise<IInstruction> {
    const sessionKeyBytes = bs58.decode(args.newSessionKey);
    return Secp256k1Instruction.createSessionV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        authorityData: this.data,
        roleId: args.roleId,
        sessionDuration: args.sessionDuration ?? this.maxDuration,
        sessionKey: sessionKeyBytes,
      },
      args.options,
    );
  }
}

export type SessionData = {
  publicKey: Uint8Array;
  sessionKey: Uint8Array;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};
