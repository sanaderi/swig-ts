import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import {
  AuthorityType,
  getCreateSecp256k1SessionDecoder,
  getCreateSecp256k1SessionEncoder,
  getSecp256k1SessionDecoder,
  type Secp256k1SessionAuthorityDataArgs,
} from '@swig/coder';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
import { Authority, SessionBasedAuthority } from '../abstract';
import { Ed25519Instruction, Secp256k1Instruction } from '../instructions';
import type { InstructionDataOptions } from '../instructions/interface';

export class Secp256k1SessionAuthority extends SessionBasedAuthority {
  type = AuthorityType.Secp256k1Session;

  constructor(data: Uint8Array, roleId?: number) {
    super(data, roleId ?? null);
  }

  get id() {
    return this.publicKeyBytes;
  }

  get signer() {
    return this.sessionKey.toBytes()
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

  get sessionKey(): PublicKey {
    return this.info.sessionKey;
  }

  get expirySlot() {
    return this.info.currentSessionExpiration;
  }

  get maxDuration() {
    return this.info.maxSessionLength;
  }

  private get _uninitPublicKeyBytes() {
    let bytes = new Uint8Array(65);
    bytes.set([4]);
    bytes.set(this.info.publicKey, 1);
    return bytes;
  }

  private get info(): SessionData {
    let data: Secp256k1SessionAuthorityDataArgs = this.isInitialized()
      ? getSecp256k1SessionDecoder().decode(this.data)
      : {
          ...getCreateSecp256k1SessionDecoder().decode(this.data),
          currentSessionExpiration: 0n,
        };
    return {
      ...data,
      publicKey: Uint8Array.from(data.publicKey),
      sessionKey: new PublicKey(data.sessionKey),
    };
  }

  static uninitializedString(
    publicKey: string,
    maxSessionDuration: bigint,
    sessionKey?: PublicKey,
  ): Secp256k1SessionAuthority {
    let bytes = hexToBytes(publicKey);
    return Secp256k1SessionAuthority.uninitialized(
      bytes,
      maxSessionDuration,
      sessionKey,
    );
  }

  static uninitialized(
    publicKey: Uint8Array,
    maxSessionDuration: bigint,
    sessionKey?: PublicKey,
  ): Secp256k1SessionAuthority {
    let sessionData = getCreateSecp256k1SessionEncoder().encode({
      publicKey: publicKey.slice(1),
      sessionKey: sessionKey
        ? sessionKey.toBytes()
        : Uint8Array.from(Array(32)),
      maxSessionLength: maxSessionDuration,
    });

    return new this(Uint8Array.from(sessionData));
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
    swigAddress: PublicKey;
    payer: PublicKey;
    actingRoleId: number;
    actions: Actions;
    newAuthority: Authority;
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

  createSession(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    newSessionKey: PublicKey;
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
        sessionKey: args.newSessionKey.toBytes(),
      },
      args.options,
    );
  }
}

export type SessionData = {
  publicKey: Uint8Array;
  sessionKey: PublicKey;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};
